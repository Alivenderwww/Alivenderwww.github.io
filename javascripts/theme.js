// 主题管理脚本 - 支持默认主题和万圣节主题
(function() {
    'use strict';
    
    // 动态导入动画模块（如果需要）
    let animationModule = null;
    
    // 尝试加载动画模块
    async function loadAnimationModule() {
        if (!animationModule) {
            try {
                // 检查动画脚本是否已加载
                if (window.playThemeSwitchAnimation) {
                    animationModule = {
                        playThemeSwitchAnimation: window.playThemeSwitchAnimation,
                        getThemeColor: window.getThemeColor
                    };
                }
            } catch (e) {
                console.log('Animation module not available');
            }
        }
        return animationModule;
    }
    
    // 主题切换状态管理
    let currentColorScheme = 'blue'; // 'blue' 或 'purple'
    let isGiscusReady = false; // Giscus 是否已加载完成
    const giscusCssCache = {}; // 缓存 Giscus CSS

    // 预加载 Giscus CSS
    function preloadGiscusCss() {
        const urls = ["/stylesheets/comments_dark.css", "/stylesheets/comments_light.css"];
        urls.forEach(url => {
            fetch(url).then(res => res.text()).then(text => {
                giscusCssCache[url] = text;
            }).catch(e => console.error('Failed to preload:', url, e));
        });
    }

    // 监听 Giscus 消息
    window.addEventListener('message', function(event) {
        if (event.origin === 'https://giscus.app') {
            if (!isGiscusReady) {
                isGiscusReady = true;
                updateGiscusTheme();
            }
        }
    });
    
    // 获取当前主题偏好
    function getColorSchemePreference() {
        return localStorage.getItem('color-scheme-preference') || 'blue';
    }
    
    // 保存主题偏好
    function saveColorSchemePreference(scheme) {
        localStorage.setItem('color-scheme-preference', scheme);
        currentColorScheme = scheme;
    }
    
    // 获取当前主题名称
    function getCurrentThemeName() {
        if (isHalloween()) {
            return 'halloween';
        }
        return currentColorScheme;
    }
    
    // 检查当前日期是否为10月31日
    function isHalloween() {
        const today = new Date();
        return today.getMonth() === 9 && today.getDate() === 31; // 月份从0开始，9代表10月
    }
    
    // 更新Giscus主题
    async function updateGiscusTheme() {
        if (!isGiscusReady) return;

        // Get computed styles to retrieve current theme variables
        const computedStyle = getComputedStyle(document.body);
        
        // List of variables we need to pass to Giscus
        const variables = [
            '--md-primary-top-color',
            '--md-primary-fg-color',
            '--md-accent-fg-color',
            '--md-primary-fg-color--light',
            '--md-primary-fg-color--dark',
            '--md-primary-blue',
            '--md-primary-blue--light',
            '--md-primary-blue--dark',
            '--md-primary-text',
            '--md-primary-text-light',
            '--md-primary-text-dark',
            '--md-primary-text-reverse',
            '--md-primary-text-rgb',
            '--md-primary-text--color',
            '--md-code-bg-color',
            '--md-code-hl-color',
            '--md-code-hl-color--light',
            '--md-code-hl-function-color',
            '--md-code-hl-constant-color',
            '--md-code-hl-keyword-color',
            '--md-code-hl-string-color',
            '--md-typeset-a-color'
        ];

        let cssVars = '';
        variables.forEach(v => {
            const value = computedStyle.getPropertyValue(v).trim();
            if (value) {
                cssVars += `${v}: ${value};\n`;
            }
        });

        let isSlate = false;
        if (window.__md_get) {
            const palette = window.__md_get("__palette");
            if (palette && palette.color && palette.color.scheme) {
                isSlate = palette.color.scheme === "slate";
            }
        }
        
        const cssUrl = isSlate 
            ? "/stylesheets/comments_dark.css"
            : "/stylesheets/comments_light.css";
            
        try {
            let cssText;
            if (giscusCssCache[cssUrl]) {
                cssText = giscusCssCache[cssUrl];
            } else {
                const response = await fetch(cssUrl);
                cssText = await response.text();
                giscusCssCache[cssUrl] = cssText;
            }
            
            // 将变量定义放在最后，以确保 @import 语句（如果在 cssText 开头）保持在文件最前面
            const injectedCss = `${cssText}\n:root {\n${cssVars}\n}`;
            
            // Use Data URI instead of Blob URL because Giscus (cross-origin) cannot read Blob URL
            const base64Css = btoa(unescape(encodeURIComponent(injectedCss)));
            const dataUrl = `data:text/css;base64,${base64Css}`;
            
            const iframe = document.querySelector('iframe.giscus-frame');
            if (iframe) {
                iframe.contentWindow.postMessage(
                    { giscus: { setConfig: { theme: dataUrl } } },
                    'https://giscus.app'
                );
            }
        } catch (e) {
            console.error('Failed to update Giscus theme:', e);
        }
    }

    // 应用主题（实际执行主题切换的函数）
    function applyThemeInternal() {
        const themeName = getCurrentThemeName();
        
        // 设置自定义主题属性
        document.body.setAttribute('data-custom-theme', themeName);
        
        // 移除旧的动态样式元素（如果存在）
        const oldStyle = document.getElementById('dynamic-theme');
        if (oldStyle) {
            oldStyle.remove();
        }
        const oldBgStyle = document.getElementById('dynamic-background');
        if (oldBgStyle) {
            oldBgStyle.remove();
        }
        
        // 替换首页欢迎语
        replaceHomeGreeting();
        
        // 更新主题切换按钮状态
        updateThemeToggleButton();
        
        if (isHalloween()) {
            console.log('Happy Halloween!');
        }

        // 更新Giscus主题
        // 使用 requestAnimationFrame 确保在下一帧渲染前执行，减少延迟
        requestAnimationFrame(() => {
            updateGiscusTheme();
        });

        // 分发主题切换事件，通知其他组件（如 Spine Viewer）
        // 使用 setTimeout 确保在样式计算更新后触发
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('themeChange', { 
                    detail: { 
                        theme: themeName,
                        isHalloween: isHalloween()
                    } 
                }));
            }, 50);
        });
    }
    
    // 应用主题（带动画的包装函数）
    async function applyTheme(withAnimation = false) {
        // 如果不需要动画或动画模块不可用，直接切换
        if (!withAnimation) {
            applyThemeInternal();
            return;
        }
        
        // 尝试加载动画模块
        const animation = await loadAnimationModule();
        
        if (!animation) {
            // 动画模块不可用，直接切换
            applyThemeInternal();
            return;
        }
        
        // 获取目标主题色
        const themeColor = getThemeColorForAnimation();
        
        // 播放动画并在动画中切换主题
        try {
            await animation.playThemeSwitchAnimation(themeColor, () => {
                applyThemeInternal();
            });
        } catch (e) {
            console.error('Animation error:', e);
            // 动画失败，直接切换主题
            applyThemeInternal();
        }
    }
    
    // 获取当前主题对应的颜色（用于动画）
    function getThemeColorForAnimation() {
        if (isHalloween()) {
            return '#ff8c00'; // 橙色（万圣节）
        }
        return currentColorScheme === 'purple' ? '#a569bd' : '#5fbeeb'; // 紫色或蓝色
    }
    
    // 替换首页欢迎语
    function replaceHomeGreeting() {
        // 查找首页的h1标题
        const h1Elements = document.querySelectorAll('h1');
        
        for (let h1 of h1Elements) {
            if (h1.textContent.includes('Ciallo～(∠・ω< )⌒★')) {
                if (isHalloween()) {
                    // 万圣节欢迎语
                    h1.textContent = '🎃 Happy Halloween!';
                    h1.setAttribute('data-halloween', 'true');
                } else {
                    // 恢复原始欢迎语（如果之前被修改过）
                    if (h1.getAttribute('data-halloween') === 'true') {
                        h1.textContent = 'Ciallo～(∠・ω< )⌒★';
                        h1.removeAttribute('data-halloween');
                    }
                }
                break;
            } else if (h1.getAttribute('data-halloween') === 'true' && !isHalloween()) {
                // 不是万圣节但标题被标记为万圣节主题，恢复原样
                h1.textContent = 'Ciallo～(∠・ω< )⌒★';
                h1.removeAttribute('data-halloween');
                break;
            }
        }
    }
    
    // 绑定主题切换按钮事件
    function bindThemeToggleEvents() {
        const toggleButton = document.getElementById('theme-toggle-btn');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', async () => {
                if (!isHalloween()) {
                    // 切换主题
                    const newScheme = currentColorScheme === 'blue' ? 'purple' : 'blue';
                    saveColorSchemePreference(newScheme);
                    // 带动画地应用主题
                    await applyTheme(true);
                }
            });
        }
    }
    
    // 更新主题切换按钮状态
    function updateThemeToggleButton() {
        const blueIcon = document.getElementById('blue-theme-icon');
        const purpleIcon = document.getElementById('purple-theme-icon');
        const container = document.getElementById('color-scheme-toggle-header');
        
        if (!blueIcon || !purpleIcon) return;
        
        // 根据当前主题显示对应的图标
        if (currentColorScheme === 'blue') {
            blueIcon.style.display = 'block';
            purpleIcon.style.display = 'none';
        } else {
            blueIcon.style.display = 'none';
            purpleIcon.style.display = 'block';
        }
        
        // 万圣节期间禁用按钮
        if (container) {
            if (isHalloween()) {
                container.classList.add('disabled');
            } else {
                container.classList.remove('disabled');
            }
        }
    }
    
    // 初始化主题
    function initTheme() {
        // 恢复保存的主题偏好
        currentColorScheme = getColorSchemePreference();
        
        // 应用主题
        applyTheme();
        
        // 绑定主题切换按钮事件
        bindThemeToggleEvents();

        // 绑定MkDocs调色板切换事件
        const paletteSwitch = document.querySelector("[data-md-component=palette]");
        if (paletteSwitch) {
            paletteSwitch.addEventListener("change", () => {
                // 使用 requestAnimationFrame 替代 setTimeout，响应更快
                requestAnimationFrame(() => {
                    applyTheme();
                });
            });
        }

        // 监听 body 属性变化 (用于检测 MkDocs 的主题切换，比事件监听更可靠)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "data-md-color-scheme") {
                    applyTheme();
                }
            });
        });
        
        if (document.body) {
            observer.observe(document.body, { attributes: true });
        }

        // 预加载 CSS
        preloadGiscusCss();
    }
    
    // 页面加载完成后应用主题
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // 监听MkDocs Material的instant navigation事件
    // 这样在站内跳转时也会重新应用主题
    document$.subscribe(function() {
        applyTheme();
    });
    
    // 监听pushState和replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(applyTheme, 0);
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        setTimeout(applyTheme, 0);
    };
})();
