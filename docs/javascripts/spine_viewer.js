import { loadSpineFromApi, scheduleLoad } from './spine_core.js';
import { SpineSelector, SpineController } from './spine_ui.js';

function initThemeObserver(container) {
    const updateFromTheme = () => {
        const style = getComputedStyle(document.body);
        const id = style.getPropertyValue('--spine-id').trim().replace(/^['"]|['"]$/g, '');
        const scale = style.getPropertyValue('--spine-scale').trim();
        const x = style.getPropertyValue('--spine-x').trim();
        const y = style.getPropertyValue('--spine-y').trim();
        const alpha = style.getPropertyValue('--spine-alpha').trim();

        console.log(`[SpineTheme] Detected theme change. ID: ${id}, Scale: ${scale}, X: ${x}, Y: ${y}, Alpha: ${alpha}`);

        // Only update if value exists in CSS
        // Note: SpineController observes dataset changes and will trigger reload/update automatically
        if (id && id !== container.dataset.id) {
            console.log(`[SpineTheme] Updating ID from ${container.dataset.id} to ${id}`);
            container.dataset.id = id;
        }
        if (scale) container.dataset.scale = scale;
        if (x) container.dataset.x = x;
        if (y) container.dataset.y = y;
        if (alpha) container.dataset.alpha = alpha;
    };

    // Initial check
    updateFromTheme();

    // Listen for custom themeChange event
    const onThemeChange = (e) => {
        if (!container.isConnected) {
            window.removeEventListener('themeChange', onThemeChange);
            return;
        }

        console.log("[SpineTheme] Received themeChange event", e.detail);
        
        // Check immediately
        updateFromTheme();
        
        // Check again after delays to ensure CSS is updated
        setTimeout(updateFromTheme, 100);
        setTimeout(updateFromTheme, 500);
    };
    window.addEventListener('themeChange', onThemeChange);

    // Polling check for the first few seconds to handle initial load instability
    let checkCount = 0;
    const interval = setInterval(() => {
        updateFromTheme();
        checkCount++;
        if (checkCount > 4) clearInterval(interval);
    }, 500);
}

export function initSpinePlayers() {
    const players = document.querySelectorAll('.spine-player');
    players.forEach(container => {
        if (container.dataset.loaded) return; // Already loaded
        
        // Default styles if not set
        if (!container.style.width) container.style.width = '100%';
        if (!container.style.height) container.style.height = '600px';
        if (!container.id) container.id = `spine-player-${Math.random().toString(36).substr(2, 9)}`;

        container.dataset.loaded = "true";
        
        // Initialize Selector
        new SpineSelector(container.id);
        
        // Initialize Controller
        new SpineController(container.id);
        
        // Initialize Theme Observer (Sync CSS variables to dataset) - Only on home page
        if (document.getElementById('app')) {
            initThemeObserver(container);
        }
        
        const id = container.dataset.id;
        if (!id) return;

        // Set dimensions if provided
        if (container.dataset.width) container.style.width = container.dataset.width;
        if (container.dataset.height) container.style.height = container.dataset.height;

        const options = container._spineOptions || {};

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
            console.error("Spine Init Error:", e);
            container.innerHTML = `<div style="color:red; padding:20px;">Failed to load Spine #${id}: ${msg}</div>`;
        });
    });
}


