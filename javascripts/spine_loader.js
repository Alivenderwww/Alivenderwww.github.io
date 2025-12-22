(function() {
    // Dynamic import of the module
    const loadModule = async () => {
        try {
            // Adjust path relative to where this script is loaded (usually root or docs)
            // Since this is injected into HTML, relative path ./javascripts/ might work if base is correct.
            // But MkDocs URLs can be tricky. Let's try absolute path from root if possible, 
            // or rely on the fact that 'javascripts/' is usually at the same level.
            // We use a relative path assuming the script is loaded from the site root.
            const module = await import('./spine_viewer.js');
            return module;
        } catch (e) {
            console.error("Failed to load spine_viewer module:", e);
            return null;
        }
    };

    let initSpinePlayers = null;

    const runInit = () => {
        if (initSpinePlayers) {
            initSpinePlayers();
        }
    };

    // Load module and start observing
    loadModule().then(module => {
        if (!module) return;
        initSpinePlayers = module.initSpinePlayers;
        
        // Run immediately
        runInit();

        // Observe for changes (MkDocs Instant Loading)
        const observer = new MutationObserver((mutations) => {
            let shouldRun = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldRun = true;
                    break;
                }
            }
            if (shouldRun) {
                runInit();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
