import * as PIXI from 'pixi.js';
import { Spine, SkeletonBinary, AtlasAttachmentLoader, TextureAtlas, SpineTexture } from '@esotericsoftware/spine-pixi-v7';

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

    try {
        // Unified Fetcher with Proxy Support
        const fetchUrl = async (url, type = 'text') => {
            const targets = [
                url, // Try direct first (for local or allowed domains)
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`
            ];

            for (const target of targets) {
                try {
                    const res = await fetch(target);
                    if (!res.ok) continue;
                    
                    if (type === 'buffer') return await res.arrayBuffer();
                    if (type === 'blob') return await res.blob();
                    if (type === 'json') return await res.json();
                    return await res.text();
                } catch (e) { /* continue */ }
            }
            throw new Error(`Failed to load ${url}`);
        };

        // 1. Resolve Source Data
        let data;
        if (typeof source === 'number' || (typeof source === 'string' && /^\d+$/.test(source))) {
            // If ID provided, construct URL
            source = `https://api.kivo.wiki/api/v1/data/spines/${source}`;
        }

        if (typeof source === 'string') {
            console.log(`Fetching API: ${source}`);
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

        // 2. Fetch Assets (Skel & Atlas)
        const [skelBuffer, atlasText] = await Promise.all([
            fetchUrl(skelUrl, 'buffer'),
            fetchUrl(atlasUrl, 'text')
        ]);

        // 3. Patch Binary Header (Blue Archive Magic Bytes)
        const originalUint8 = new Uint8Array(skelBuffer);
        let finalBuffer = originalUint8;
        if (originalUint8.length > 10 && originalUint8[8] === 0x07 && originalUint8[9] === 0x34) { 
            console.log("Patching binary header...");
            const patchedBuffer = new Uint8Array(originalUint8);
            patchedBuffer.set([7, 100, 117, 109, 109, 121, 48, 48], 0); // "dummy00"
            finalBuffer = patchedBuffer;
        }

        // 4. Parse Atlas & Load Textures
        const atlas = new TextureAtlas(atlasText);
        
        for (const page of atlas.pages) {
            const textureUrl = imageUrls.find(url => url.endsWith(page.name));
            if (!textureUrl) {
                console.warn(`Texture URL not found for page: ${page.name}`);
                continue;
            }

            console.log(`Loading texture: ${textureUrl}`);
            
            // Always use Blob -> BaseTexture flow for consistency and proxy support
            const blob = await fetchUrl(textureUrl, 'blob');
            const blobUrl = URL.createObjectURL(blob);
            
            // Default alpha (PMA) to false unless explicitly enabled
            const usePma = options.alpha === true;
            const baseTextureOptions = {};
            if (usePma) {
                baseTextureOptions.alphaMode = PIXI.ALPHA_MODES.PMA;
            }

            const baseTexture = new PIXI.BaseTexture(blobUrl, baseTextureOptions);
            
            if (!baseTexture.valid) {
                await new Promise((resolve, reject) => {
                    baseTexture.once('loaded', resolve);
                    baseTexture.once('error', reject);
                });
            }
            
            const texture = new PIXI.Texture(baseTexture);
            if (usePma) {
                page.pma = true;
            }
            page.setTexture(SpineTexture.from(texture.baseTexture));
        }

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
        const errText = new PIXI.Text('Error: ' + err.message, {
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
        
        const options = {};
        if (container.dataset.scale) {
            const s = parseFloat(container.dataset.scale);
            if (!isNaN(s)) options.scale = s;
        }
        if (container.dataset.alpha === 'true') {
            options.alpha = true;
        }

        loadSpineFromApi(container.id, id, options).then(({ spine }) => {
            // Optional: Apply custom animation from data attributes
            if (container.dataset.animation) {
                const anim = container.dataset.animation;
                if (spine.skeleton.data.findAnimation(anim)) {
                    spine.state.setAnimation(0, anim, true);
                }
            }
        }).catch(e => {
            container.innerHTML = `<div style="color:red; padding:20px;">Failed to load Spine #${id}: ${e.message}</div>`;
        });
    });
}
