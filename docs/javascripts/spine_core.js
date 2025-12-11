import * as PIXI from 'pixi.js';
import { Spine, SkeletonBinary, AtlasAttachmentLoader, TextureAtlas, SpineTexture } from '@esotericsoftware/spine-pixi-v7';

// kivo.wiki 禁止外域 CORS，直接请求会被拦截并拖慢加载
const HOSTS_REQUIRE_PROXY = new Set(['api.kivo.wiki', 'static.kivo.wiki']);
const FETCH_TIMEOUT_MS = 20000; // Reduced timeout
const MAX_RETRY_ATTEMPTS = 2;
const fetchCache = new Map();
const MAX_PARALLEL_LOADS = 4; // Increased parallel loads
const loadQueue = [];
let activeLoads = 0;

export const scheduleLoad = async (task) => {
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

export const fetchUrl = async (url, type = 'text', attemptIndex = 0) => {
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

    // Progress Bar Setup
    let progressBar = container.querySelector('.spine-progress-bar');
    let progressFill;
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'spine-progress-bar';
        progressBar.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: 150px;
            height: 6px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 3px;
            overflow: hidden;
            pointer-events: none;
            z-index: 100;
            display: none;
            transition: opacity 0.3s;
        `;
        progressFill = document.createElement('div');
        progressFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: #00b0ff;
            transition: width 0.2s ease-out;
        `;
        progressBar.appendChild(progressFill);
        container.appendChild(progressBar);
    } else {
        progressFill = progressBar.firstElementChild;
    }

    const updateProgress = (percent) => {
        progressBar.style.display = 'block';
        progressBar.style.opacity = '1';
        progressFill.style.width = `${percent}%`;
    };
    
    const hideProgress = () => {
        progressBar.style.opacity = '0';
        setTimeout(() => {
             if (progressBar.style.opacity === '0') progressBar.style.display = 'none';
        }, 300);
    };

    updateProgress(5); // Start

    // Reuse or Create App
    let app = container._pixiApp;
    if (!app) {
        const resolution = 1;
        app = new PIXI.Application({
            width: container.clientWidth / resolution,
            height: container.clientHeight / resolution,
            backgroundColor: 0x333333,
            antialias: true,     // 消除锯齿
            transparent: false,  // 背景不透明
            resolution: resolution,
            autoDensity: true,
            resizeTo: container
        });
        container.appendChild(app.view);
        container._pixiApp = app;

        // Global resize handler for this app
        app.renderer.on('resize', () => {
            app.stage.children.forEach(c => {
                if (c.updateLayout) c.updateLayout();
            });
        });
    }

    try {
        // 1. Resolve Source Data
        let data;
        if (typeof source === 'number' || (typeof source === 'string' && /^\d+$/.test(source))) {
            // If ID provided, construct URL
            if(container.dataset.kivo==="false"){
                source = `https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/ba/${source}.json`;
            }else{
                source = `https://api.kivo.wiki/api/v1/data/spines/${source}`;
            }
        }

        if (typeof source === 'string') {
            const apiRes = await fetchUrl(source, 'json');
            updateProgress(15);
            if (!apiRes.success) throw new Error(`API Error: ${apiRes.message}`);
            data = apiRes.data;
        } else {
            data = source.data || source;
            updateProgress(15);
        }

        const fixUrl = (url) => url ? (url.startsWith('//') ? `https:${url}` : url) : '';
        const skelUrl = fixUrl(data.skel_file);
        const atlasUrl = fixUrl(data.atlas_file);
        const imageUrls = (data.images || []).map(fixUrl);

        console.log("Skeleton URL:", skelUrl);

        // 2. Fetch Assets (Skel & Atlas & Images) in parallel
        let loadedCount = 0;
        const totalAssets = 2 + imageUrls.length;
        const baseProgress = 15;
        const maxProgress = 90; // Leave 10% for parsing/rendering
        
        const trackPromise = (p) => {
            return p.then(res => {
                loadedCount++;
                const pct = baseProgress + (loadedCount / totalAssets) * (maxProgress - baseProgress);
                updateProgress(pct);
                return res;
            });
        };

        const fetchPromises = [
            trackPromise(fetchUrl(skelUrl, 'buffer')),
            trackPromise(fetchUrl(atlasUrl, 'text')),
            ...imageUrls.map(url => trackPromise(fetchUrl(url, 'blob')))
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
        spine.update(0);
        spine.autoUpdate = true;

        // Calculate bounds ONCE based on setup pose to prevent jittering during animation
        // We temporarily disable autoUpdate and reset to setup pose to get a stable bounding box
        spine.autoUpdate = false;
        spine.skeleton.setToSetupPose();
        spine.update(0);
        const localBounds = spine.getLocalBounds();
        spine.autoUpdate = true;
        
        // Restore animation if set
        if (idleAnim) {
            spine.state.setAnimation(0, idleAnim, true);
        }

        const updateLayout = () => {
            if (!app || !app.renderer) return;
            
            if (app.screen.width === 0 || app.screen.height === 0) return;

            // Get current user options (or defaults)
            const userScale = parseFloat(container.dataset.scale) || 1.0;
            const userX = parseFloat(container.dataset.x) || 0;
            const userY = parseFloat(container.dataset.y) || 0;

            let scale = userScale;

            if (localBounds && localBounds.width > 0 && localBounds.height > 0) {
                // Calculate the scale needed to fit the container height
                const fitHeightScale = app.screen.height / localBounds.height;
                const fitWidthScale = app.screen.width / localBounds.width;
                
                // Apply user multiplier
                scale = Math.max(fitHeightScale, fitWidthScale) * userScale;
                
                // Clamp to reasonable limits to prevent glitches
                scale = Math.min(Math.max(scale, 0.01), 10.0);
                spine.scale.set(scale);
                
                // Center the spine based on its bounds
                spine.x = app.screen.width / 2 - (localBounds.x + localBounds.width / 2) * scale;
                spine.y = app.screen.height / 2 - (localBounds.y + localBounds.height / 2) * scale;    
            } else {
                spine.scale.set(scale);
                spine.x = app.screen.width / 2;
                spine.y = app.screen.height / 2;
            }

            // Apply User Offsets (Scaled)
            spine.x += userX * scale;
            spine.y += userY * scale;
        };

        // Bind updateLayout to spine for external access
        spine.updateLayout = updateLayout;
        
        // Initial layout
        updateLayout();

        updateProgress(100);

        // Transition Logic
        const oldSpine = app.stage.children.find(c => c instanceof Spine);
        
        spine.alpha = 0;
        app.stage.addChild(spine);
        console.log(`Spine loaded! Bounds: ${localBounds.width.toFixed(0)}x${localBounds.height.toFixed(0)}`);

        if (!oldSpine) {
            // First load: Fade In
            let alpha = 0;
            const fadeIn = () => {
                alpha += 0.05;
                if (alpha >= 1) {
                    spine.alpha = 1;
                    app.ticker.remove(fadeIn);
                    hideProgress();
                } else {
                    spine.alpha = alpha;
                }
            };
            app.ticker.add(fadeIn);
        } else {
            // Clean up old observer if exists
            if (app._resizeObserver) {
                app._resizeObserver.disconnect();
                app._resizeObserver = null;
            }

            // Cross Fade
            let progress = 0;
            const duration = 30; // frames approx 0.5s
            const crossFade = () => {
                progress += 1 / duration;
                if (progress >= 1) {
                    spine.alpha = 1;
                    oldSpine.alpha = 0;
                    app.stage.removeChild(oldSpine);
                    oldSpine.destroy({ children: true });
                    app.ticker.remove(crossFade);
                    hideProgress();
                } else {
                    spine.alpha = progress;
                    oldSpine.alpha = 1 - progress;
                }
            };
            app.ticker.add(crossFade);
        }

        // Robust Resize Handling
        
        // Clean up old resize listener to prevent stacking
        if (app._activeUpdateLayout) {
            app.renderer.off('resize', app._activeUpdateLayout);
        }
        // Store current listener for future cleanup
        app._activeUpdateLayout = updateLayout;
        
        // Listen to Pixi's resize event (triggered by resizeTo: container)
        app.renderer.on('resize', updateLayout);

        // Clean up old ResizeObserver if it exists (from previous versions of this script)
        if (app._resizeObserver) {
            app._resizeObserver.disconnect();
            app._resizeObserver = null;
        }

        // Initial check
        requestAnimationFrame(() => {
            if (app && app.renderer) {
                app.resize();
                // updateLayout will be triggered by the resize event
            }
        });

        return { app, spine };

    } catch (err) {
        hideProgress();
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
