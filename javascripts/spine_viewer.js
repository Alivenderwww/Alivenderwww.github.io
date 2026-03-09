import { loadSpineFromApi, scheduleLoad } from './spine_core.js';
import { SpineSelector, SpineController } from './spine_ui.js';

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


