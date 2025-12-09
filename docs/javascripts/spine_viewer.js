import * as PIXI from 'pixi.js';
import { Spine, SkeletonBinary, AtlasAttachmentLoader, TextureAtlas, SpineTexture } from '@esotericsoftware/spine-pixi-v7';

// kivo.wiki 禁止外域 CORS，直接请求会被拦截并拖慢加载
const HOSTS_REQUIRE_PROXY = new Set([]);
const FETCH_TIMEOUT_MS = 10000; // Reduced timeout
const MAX_RETRY_ATTEMPTS = 2;
const fetchCache = new Map();
const MAX_PARALLEL_LOADS = 4; // Increased parallel loads
const loadQueue = [];
let activeLoads = 0;

const scheduleLoad = async (task) => {
    if (activeLoads >= MAX_PARALLEL_LOADS) {
        await new Promise((resolve) => loadQueue.push(resolve));
    }

    activeLoads++;
    try {
        return await task();
    } finally {
        activeLoads--;
        const next = loadQueue.shift();
        if (next) {
            next();
        }
    }
};

const buildProxyTargets = (urlObj) => {
    const href = urlObj.href;
    return [
        `https://corsproxy.io/?${encodeURIComponent(href)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(href)}`
    ];
};

const fetchWithTimeout = async (target, type) => {
    const controller = window.AbortController ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;

    try {
        const response = await fetch(target, {
            signal: controller ? controller.signal : undefined,
            mode: 'cors',
            credentials: 'omit'
        });

        if (response.status === 429) {
            const retryAfter = Math.min(parseInt(response.headers.get('retry-after') || '0', 10), 5);
            const error = new Error(`HTTP 429`);
            error.retryAfter = retryAfter > 0 ? retryAfter * 1000 : 0;
            throw error;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (type === 'buffer') return await response.arrayBuffer();
        if (type === 'blob') return await response.blob();
        if (type === 'json') return await response.json();
        return await response.text();
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUrl = async (url, type = 'text', attemptIndex = 0) => {
    const delayMs = 150 * attemptIndex * attemptIndex;
    if (delayMs > 0) {
        await delay(Math.min(delayMs, 1000));
    }

    const urlObj = new URL(url, window.location.href);
    const cacheKey = `${type}:${urlObj.href}`;

    if (fetchCache.has(cacheKey)) {
        return fetchCache.get(cacheKey);
    }

    const needsProxy = HOSTS_REQUIRE_PROXY.has(urlObj.hostname);
    const targets = needsProxy ? [] : [urlObj.href];
    const proxyTargets = buildProxyTargets(urlObj);
    for (const proxyTarget of proxyTargets) {
        if (!targets.includes(proxyTarget)) {
            targets.push(proxyTarget);
        }
    }

    const promise = (async () => {
        let lastError = null;
        let rateLimitWait = 0;

        for (const target of targets) {
            try {
                return await fetchWithTimeout(target, type);
            } catch (err) {
                lastError = err;
                if (err.message && err.message.includes('HTTP 429')) {
                    rateLimitWait = Math.max(rateLimitWait, err.retryAfter || 500);
                    continue;
                }
            }
        }

        if (rateLimitWait > 0 && attemptIndex < MAX_RETRY_ATTEMPTS) {
            const wait = Math.min(rateLimitWait + 150 * (attemptIndex + 1) * (attemptIndex + 1), 4000);
            fetchCache.delete(cacheKey);
            await delay(wait);
            return fetchUrl(urlObj.href, type, attemptIndex + 1);
        }

        if (lastError) {
            throw lastError;
        }

        throw new Error(`Failed to load ${urlObj.href}`);
    })().catch((err) => {
        fetchCache.delete(cacheKey);
        throw err;
    });

    fetchCache.set(cacheKey, promise);
    return promise;
};

/**
 * Loads and renders a Spine animation from a Kivo Wiki API endpoint.
 * @param {string} containerId - The ID of the HTML element to render into.
 * @param {string|object} source - The API URL to fetch spine data from, or the data object itself.
 * @param {object} options - Optional settings (scale, animation, etc.)
 */
export async function loadSpineFromApi(containerId, source, options = {}) {
    // Fix for transparency issues with createImageBitmap
    PIXI.Assets.setPreferences({
        preferCreateImageBitmap: true,
        preferWorker: true
    });

    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);

    // Cleanup existing app
    if (container._pixiApp) {
        container._pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
        container._pixiApp = null;
    }

    // Init App
    const app = new PIXI.Application({
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        backgroundColor: 0x333333,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: container
    });
    container.appendChild(app.view);
    container._pixiApp = app;

    try {
        // 1. Resolve Source Data
        let data;
        if (typeof source === 'number' || (typeof source === 'string' && /^\d+$/.test(source))) {
            // If ID provided, construct URL
            source = `https://api.kivo.wiki/api/v1/data/spines/${source}`;
        }

        if (typeof source === 'string') {
            const apiRes = await fetchUrl(source, 'json');
            if (!apiRes.success) throw new Error(`API Error: ${apiRes.message}`);
            data = apiRes.data;
        } else {
            data = source.data || source;
        }

        const fixUrl = (url) => url ? (url.startsWith('//') ? `https:${url}` : url) : '';
        const skelUrl = fixUrl(data.skel_file);
        const atlasUrl = fixUrl(data.atlas_file);
        const imageUrls = (data.images || []).map(fixUrl);

        console.log("Skeleton URL:", skelUrl);

        // 2. Fetch Assets (Skel & Atlas & Images) in parallel
        const fetchPromises = [
            fetchUrl(skelUrl, 'buffer'),
            fetchUrl(atlasUrl, 'text'),
            ...imageUrls.map(url => fetchUrl(url, 'blob'))
        ];

        const [skelBuffer, atlasText, ...imageBlobs] = await Promise.all(fetchPromises);

        // 3. Patch Binary Header (Blue Archive Magic Bytes)
        const originalUint8 = new Uint8Array(skelBuffer);
        let finalBuffer = originalUint8;
        if (originalUint8.length > 10 && originalUint8[8] === 0x07 && originalUint8[9] === 0x34) { 
            console.log("Patching binary header...");
            const patchedBuffer = new Uint8Array(originalUint8);
            patchedBuffer.set([7, 100, 117, 109, 109, 121, 48, 48], 0); // "dummy00"
            finalBuffer = patchedBuffer;
        }

        // 4. Parse Atlas & Load Textures (using pre-fetched blobs)
        const atlas = new TextureAtlas(atlasText);
        
        const blobMap = new Map();
        imageUrls.forEach((url, idx) => {
            blobMap.set(url, imageBlobs[idx]);
        });

        await Promise.all(atlas.pages.map(async (page) => {
            const textureUrl = imageUrls.find(url => url.endsWith(page.name));
            if (!textureUrl) {
                console.warn(`Texture URL not found for page: ${page.name}`);
                return;
            }

            console.log(`Loading texture: ${textureUrl}`);

            const blob = blobMap.get(textureUrl);
            if (blob.type && !blob.type.startsWith('image/')) {
                console.warn(`[Spine] Texture blob type mismatch: ${blob.type} for ${textureUrl}. This might be a proxy error page.`);
            }
            const blobUrl = URL.createObjectURL(blob);

            const usePma = options.alpha === true;
            const baseTextureOptions = {};
            if (usePma) {
                baseTextureOptions.alphaMode = PIXI.ALPHA_MODES.PMA;
            }

            const baseTexture = new PIXI.BaseTexture(blobUrl, baseTextureOptions);

            const revokeUrl = () => URL.revokeObjectURL(blobUrl);
            if (!baseTexture.valid) {
                await new Promise((resolve, reject) => {
                    baseTexture.once('loaded', () => {
                        revokeUrl();
                        resolve();
                    });
                    baseTexture.once('error', (err) => {
                        revokeUrl();
                        reject(err);
                    });
                });
            } else {
                revokeUrl();
            }

            const texture = new PIXI.Texture(baseTexture);
            if (usePma) {
                page.pma = true;
            }
            page.setTexture(SpineTexture.from(texture.baseTexture));
        }));

        // 5. Create Spine Instance
        const atlasLoader = new AtlasAttachmentLoader(atlas);
        const binary = new SkeletonBinary(atlasLoader);
        const skeletonData = binary.readSkeletonData(finalBuffer);
        const spine = new Spine(skeletonData);
        
        // 6. Setup Animation & Positioning
        const anims = spine.skeleton.data.animations.map(a => a.name);
        console.log("Available animations:", anims);
        
        const idleAnim = anims.find(a => /Idle_01/i.test(a)) || 
                         anims.find(a => /Start_Idle_01/i.test(a)) || 
                         anims.find(a => /idle|stand|home/i.test(a)) || 
                         anims[0];
                         
        if (idleAnim) {
            console.log(`Playing animation: ${idleAnim}`);
            spine.state.setAnimation(0, idleAnim, true);
        }
        
        spine.skeleton.setToSetupPose();
        spine.update(0.1);
        spine.autoUpdate = true;

        // Auto-Scale and Center
        const localBounds = spine.getLocalBounds();
        
        // User defined scale multiplier (default 1.0)
        // data-scale="1" means "Fit Height perfectly"
        const userScale = options.scale || 1.0;
        
        let scale = 1.0;
        
        if (localBounds.width > 0 && localBounds.height > 0) {
            // Calculate the scale needed to fit the container height
            const fitHeightScale = app.screen.height / localBounds.height;
            const fitWidthScale = app.screen.width / localBounds.width;
            
            // Apply user multiplier
            scale = Math.max(fitHeightScale, fitWidthScale) * userScale;
            
            // Clamp to reasonable limits to prevent glitches
            scale = Math.min(Math.max(scale, 0.01), 10.0);
            
            // Center the spine based on its bounds
            spine.x = app.screen.width / 2 - (localBounds.x + localBounds.width / 2) * scale;
            spine.y = app.screen.height / 2 - (localBounds.y + localBounds.height / 2) * scale;
        } else {
            // Fallback if bounds are invalid (rare)
            scale = userScale * 0.5; 
            spine.x = app.screen.width / 2;
            spine.y = app.screen.height * 0.8;
        }
        
        spine.scale.set(scale);

        app.stage.addChild(spine);
        console.log(`Spine loaded! Bounds: ${localBounds.width.toFixed(0)}x${localBounds.height.toFixed(0)}, Scale: ${scale.toFixed(4)} (User: ${userScale})`);

        return { app, spine };

    } catch (err) {
        console.error("Error loading spine:", err);
        let msg = err.message || String(err);
        if (err instanceof Event) {
            msg = `Texture loading failed (Event type: ${err.type})`;
        }
        const errText = new PIXI.Text('Error: ' + msg, {
            fill: 'red', 
            wordWrap: true, 
            wordWrapWidth: app.screen.width - 40,
            breakWords: true
        });
        errText.x = 20;
        errText.y = 20;
        app.stage.addChild(errText);
        throw err;
    }
}

/**
 * Auto-initializes all elements with class "spine-player".
 * Usage in HTML:
 * <div class="spine-player" 
 *      data-id="799" 
 *      data-width="800" 
 *      data-height="600" 
 *      data-scale="0.8" 
 *      data-animation="Idle_01">
 * </div>
 */


class SpineSelector {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.menu = null;
        this.cols = [];
        this.data = { students: [] };
        this.page = 1;
        this.pageSize = 100;
        this.maxPage = Infinity;
        this.isLoading = false;
        this.groupedStudents = new Map();
        
        this.init();
    }

    init() {
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }

        const btn = document.createElement('div');
        btn.className = 'spine-selector-btn';
        btn.textContent = '☰';
        btn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMenu();
        };
        this.container.appendChild(btn);

        this.menu = document.createElement('div');
        this.menu.className = 'spine-selector-menu';
        this.menu.onclick = (e) => e.stopPropagation();
        this.container.appendChild(this.menu);
        
        document.addEventListener('click', () => {
            this.menu.style.display = 'none';
        });
    }

    toggleMenu() {
        if (this.menu.style.display === 'flex') {
            this.menu.style.display = 'none';
        } else {
            this.menu.style.display = 'flex';
            if (this.data.students.length === 0) {
                console.log("Loading students...");
                this.loadStudents();
            }
        }
    }

    async loadStudents() {
        if (this.isLoading || this.page > this.maxPage) return;
        this.isLoading = true;

        // Show loading indicator only on first load or if needed
        if (this.page === 1) {
            this.renderCol(0, [{ name: 'Loading...', id: -1 }]);
        }

        try {
            const res = await fetchUrl(`https://api.kivo.wiki/api/v1/data/students/?page=${this.page}&page_size=${this.pageSize}`, 'json');
            if (!res.success) throw new Error(res.message);
            
            this.maxPage = res.data.max_page;
            const newStudents = res.data.students;
            
            newStudents.forEach(s => {
                const name = (s.family_name || '') + (s.given_name || '');
                if (!name) return;
                
                if (!this.groupedStudents.has(name)) {
                    this.groupedStudents.set(name, {
                        name: name,
                        defaultAvatar: s.avatar,
                        skins: []
                    });
                }
                const group = this.groupedStudents.get(name);
                group.skins.push(s);
                if (!s.skin) {
                    group.defaultAvatar = s.avatar;
                }
            });
            
            this.data.students = Array.from(this.groupedStudents.values());
            this.renderStudents();
            
            this.page++;
        } catch (e) {
            if (this.page === 1) {
                this.renderCol(0, [{ name: 'Error: ' + e.message, id: -1 }]);
            } else {
                console.error("Failed to load more students:", e);
            }
        } finally {
            this.isLoading = false;
        }
    }

    renderCol(index, items, onClick) {
        while (this.cols.length <= index) {
            const col = document.createElement('div');
            col.className = 'spine-selector-col';
            this.menu.appendChild(col);
            this.cols.push(col);
            
            // Add scroll listener for the first column (students list)
            if (this.cols.length === 1) {
                col.addEventListener('scroll', () => {
                    if (col.scrollTop + col.clientHeight >= col.scrollHeight - 50) {
                        this.loadStudents();
                    }
                });
            }
        }
        while (this.cols.length > index + 1) {
            this.menu.removeChild(this.cols.pop());
        }

        const col = this.cols[index];
        
        // If appending to existing list (pagination), don't clear innerHTML
        // But here we are re-rendering the whole grouped list every time for simplicity
        // To optimize, we could only append new items, but since we group by name, 
        // new data might merge into existing groups. So re-rendering is safer.
        // We just need to preserve scroll position.
        const scrollTop = col.scrollTop;
        col.innerHTML = '';
        
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'spine-selector-item';
            if (item.defaultAvatar || item.avatar) {
                const img = document.createElement('img');
                let src = item.defaultAvatar || item.avatar;
                if (src.startsWith('//')) src = 'https:' + src;
                img.src = src;
                el.appendChild(img);
            }
            const span = document.createElement('span');
            span.textContent = item.name || item.skin || '原皮';
            el.appendChild(span);
            
            el.onclick = (e) => {
                e.stopPropagation();
                Array.from(col.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                if (onClick) onClick(item);
            };
            col.appendChild(el);
        });

        if (index === 0 && this.page > 1) {
             col.scrollTop = scrollTop;
        }
    }

    renderStudents() {
        this.renderCol(0, this.data.students, (student) => {
            this.renderSkins(student);
        });
    }

    renderSkins(student) {
        if (student.skins.length === 1) {
            this.selectSkin(student.skins[0], 1);
        } else {
            const items = student.skins.map(s => ({
                ...s,
                name: s.skin_cn || s.skin || '原皮'
            }));
            this.renderCol(1, items, (skin) => {
                this.selectSkin(skin, 2);
            });
        }
    }

    async selectSkin(skin, colIndex) {
        this.renderCol(colIndex, [{ name: 'Loading...', id: -1 }]);
        
        try {
            const studentRes = await fetchUrl(`https://api.kivo.wiki/api/v1/data/students/${skin.id}`, 'json');
            if (!studentRes.success) throw new Error(studentRes.message);
            
            const spineIds = studentRes.data.spine || [];
            if (spineIds.length === 0) {
                this.renderCol(colIndex, [{ name: 'No spines', id: -1 }]);
                return;
            }

            const validSpines = [];
            // Fetch spines in parallel
            await Promise.all(spineIds.map(async (sid) => {
                try {
                    const spineRes = await fetchUrl(`https://api.kivo.wiki/api/v1/data/spines/${sid}`, 'json');
                    if (spineRes.success && spineRes.data.type === 'home') {
                        validSpines.push(spineRes.data);
                    }
                } catch (e) {
                    console.warn('Failed to fetch spine', sid, e);
                }
            }));

            if (validSpines.length === 0) {
                this.renderCol(colIndex, [{ name: 'No home spines', id: -1 }]);
                return;
            }

            if (validSpines.length === 1) {
                this.loadSpine(validSpines[0].id);
                this.menu.style.display = 'none';
            } else {
                this.renderCol(colIndex, validSpines, (spine) => {
                    this.loadSpine(spine.id);
                    this.menu.style.display = 'none';
                });
            }

        } catch (e) {
            this.renderCol(colIndex, [{ name: 'Error: ' + e.message, id: -1 }]);
        }
    }

    loadSpine(id) {
        loadSpineFromApi(this.containerId, id);
    }
}

export function initSpinePlayers() {
    const players = document.querySelectorAll('.spine-player');
    players.forEach(container => {
        if (container.dataset.loaded) return; // Already loaded
        
        const id = container.dataset.id;
        if (!id) return;

        // Set dimensions if provided
        if (container.dataset.width) container.style.width = container.dataset.width;
        if (container.dataset.height) container.style.height = container.dataset.height;
        
        // Default styles if not set
        if (!container.style.width) container.style.width = '100%';
        if (!container.style.height) container.style.height = '600px';
        if (!container.id) container.id = `spine-player-${Math.random().toString(36).substr(2, 9)}`;

        container.dataset.loaded = "true";
        
        // Initialize Selector
        new SpineSelector(container.id);
        
        const options = {};
        if (container.dataset.scale) {
            const s = parseFloat(container.dataset.scale);
            if (!isNaN(s)) options.scale = s;
        }
        if (container.dataset.alpha === 'true') {
            options.alpha = true;
        }

        scheduleLoad(() => loadSpineFromApi(container.id, id, options)).then(({ spine }) => {
            // Optional: Apply custom animation from data attributes
            if (container.dataset.animation) {
                const anim = container.dataset.animation;
                if (spine.skeleton.data.findAnimation(anim)) {
                    spine.state.setAnimation(0, anim, true);
                }
            }
        }).catch(e => {
            const msg = e.message || (e instanceof Event ? `Texture Error (${e.type})` : String(e));
            container.innerHTML = `<div style="color:red; padding:20px;">Failed to load Spine #${id}: ${msg}</div>`;
        });
    });
}


