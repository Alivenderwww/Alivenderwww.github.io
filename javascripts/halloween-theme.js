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
    
    // 默认主题配置（蓝色）
    const defaultTheme = {
        light: {
            '--md-primary-top-color': '#454d6d',
            '--md-primary-fg-color': '#425a7e',
            '--md-accent-fg-color': '#166d96',
            '--md-primary-fg-color--light': '#f5f9fd',
            '--md-primary-fg-color--dark': '#282e46',
            '--md-primary-blue': '#5fbeeb',
            '--md-primary-blue--light': '#ffffff',
            '--md-primary-blue--dark': '#166d96',
            '--md-primary-text': '#4C5866',
            '--md-primary-text-light': '#e0eaf5',
            '--md-primary-text-dark': '#4C5866',
            '--md-primary-text-reverse': '#e0eaf5',
            '--md-primary-text-rgb': '84, 92, 107',
            '--md-primary-text--color': '#282e46'
        },
        dark: {
            '--md-primary-top-color': '#2b3044',
            '--md-primary-fg-color': '#f1f8ff',
            '--md-accent-fg-color': '#5bb7e2',
            '--md-primary-fg-color--light': '#232733',
            '--md-primary-fg-color--dark': '#283346',
            '--md-primary-blue': '#5bb7e2',
            '--md-primary-blue--light': '#1E2129',
            '--md-primary-blue--dark': '#2C3A4F',
            '--md-primary-text': '#e0eaf5',
            '--md-primary-text-light': '#e0eaf5',
            '--md-primary-text-dark': '#4C5866',
            '--md-primary-text-reverse': '#4C5866',
            '--md-primary-text-rgb': '226, 231, 240',
            '--md-primary-text--color': '#e0e0e0'
        },
        homeBackground: 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/home/arona.jpg'
    };
    
    // 紫色主题配置
    const purpleTheme = {
        light: {
            '--md-primary-top-color': '#423e4eff',
            '--md-primary-fg-color': '#6a4c93',
            '--md-accent-fg-color': '#8e44ad',
            '--md-primary-fg-color--light': '#f8f5fd',
            '--md-primary-fg-color--dark': '#3a2846',
            '--md-primary-blue': '#a569bd',
            '--md-primary-blue--light': '#ffffff',
            '--md-primary-blue--dark': '#6a4c93',
            '--md-primary-text': '#5c4866',
            '--md-primary-text-light': '#ebe0f5',
            '--md-primary-text-dark': '#3a2846',
            '--md-primary-text-reverse': '#ebe0f5',
            '--md-primary-text-rgb': '92, 72, 102',
            '--md-primary-text--color': '#3a2846'
        },
        dark: {
            '--md-primary-top-color': '#363042ff',
            '--md-primary-fg-color': '#d8b3ff',
            '--md-accent-fg-color': '#bb7ae2',
            '--md-primary-fg-color--light': '#1a1533',
            '--md-primary-fg-color--dark': '#3a2846',
            '--md-primary-blue': '#bb7ae2',
            '--md-primary-blue--light': '#1a1529',
            '--md-primary-blue--dark': '#3a2a4f',
            '--md-primary-text': '#ebe0f5',
            '--md-primary-text-light': '#ebe0f5',
            '--md-primary-text-dark': '#5c4866',
            '--md-primary-text-reverse': '#5c4866',
            '--md-primary-text-rgb': '235, 224, 245',
            '--md-primary-text--color': '#d8b3ff'
        },
        homeBackground: 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/home/plana.jpg'
    };
    
    // 万圣节主题配置
    const halloweenTheme = {
        light: {
            '--md-primary-top-color': '#2d1b00',
            '--md-primary-fg-color': '#8b4513',
            '--md-accent-fg-color': '#cf5300',
            '--md-primary-fg-color--light': '#fff5e6',
            '--md-primary-fg-color--dark': '#1a0d00',
            '--md-primary-blue': '#ff8c00',
            '--md-primary-blue--light': '#fff0e0',
            '--md-primary-blue--dark': '#cc7000',
            '--md-primary-text': '#4a2c0a',
            '--md-primary-text-light': '#ffe4b3',
            '--md-primary-text-dark': '#2d1b00',
            '--md-primary-text-reverse': '#ffe4b3',
            '--md-primary-text-rgb': '74, 44, 10',
            '--md-primary-text--color': '#2d1b00'
        },
        dark: {
            '--md-primary-top-color': '#1a0d00',
            '--md-primary-fg-color': '#ffb366',
            '--md-accent-fg-color': '#ff7f32',
            '--md-primary-fg-color--light': '#0d0600',
            '--md-primary-fg-color--dark': '#2d1b00',
            '--md-primary-blue': '#ff8c00',
            '--md-primary-blue--light': '#1a0d00',
            '--md-primary-blue--dark': '#4a2c0a',
            '--md-primary-text': '#ffe4b3',
            '--md-primary-text-light': '#ffe4b3',
            '--md-primary-text-dark': '#4a2c0a',
            '--md-primary-text-reverse': '#4a2c0a',
            '--md-primary-text-rgb': '255, 228, 179',
            '--md-primary-text--color': '#ffcc99'
        },
        homeBackground: 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/home/halloween-background2.jpg'
    };
    
    // 主题切换状态管理
    let currentColorScheme = 'blue'; // 'blue' 或 'purple'
    
    // 获取当前主题偏好
    function getColorSchemePreference() {
        return localStorage.getItem('color-scheme-preference') || 'blue';
    }
    
    // 保存主题偏好
    function saveColorSchemePreference(scheme) {
        localStorage.setItem('color-scheme-preference', scheme);
        currentColorScheme = scheme;
    }
    
    // 获取当前主题配置
    function getCurrentTheme() {
        if (isHalloween()) {
            return halloweenTheme;
        }
        return currentColorScheme === 'purple' ? purpleTheme : defaultTheme;
    }
    
    // 检查当前日期是否为10月31日
    function isHalloween() {
        const today = new Date();
        return today.getMonth() === 9 && today.getDate() === 31; // 月份从0开始，9代表10月
    }
    
    // 生成CSS样式字符串
    function generateThemeCSS(theme) {
        const lightVars = Object.entries(theme.light)
            .map(([key, value]) => `    ${key}: ${value};`)
            .join('\n');
        
        const darkVars = Object.entries(theme.dark)
            .map(([key, value]) => `    ${key}: ${value};`)
            .join('\n');
        
        return `
[data-md-color-primary="mycolor_light"] {
${lightVars}
}

[data-md-color-primary="mycolor_dark"] {
${darkVars}
}
        `;
    }
    
    // 应用主题（实际执行主题切换的函数）
    function applyThemeInternal() {
        const theme = getCurrentTheme();
        
        // 移除旧的主题样式
        const oldStyle = document.getElementById('dynamic-theme');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // 创建新的样式元素
        const styleElement = document.createElement('style');
        styleElement.id = 'dynamic-theme';
        styleElement.textContent = generateThemeCSS(theme);
        document.head.appendChild(styleElement);
        
        // 更改首页背景图片
        const oldBgStyle = document.getElementById('dynamic-background');
        if (oldBgStyle) {
            oldBgStyle.remove();
        }
        
        const bgStyleElement = document.createElement('style');
        bgStyleElement.id = 'dynamic-background';
        bgStyleElement.textContent = `
        body::before {
            background-image: url(${theme.homeBackground}) !important;
        }
        `;
        document.head.appendChild(bgStyleElement);
        
        // 替换首页欢迎语
        replaceHomeGreeting();
        
        // 更新主题切换按钮状态
        updateThemeToggleButton();
        
        if (isHalloween()) {
            console.log('Happy Halloween!');
        }
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
    
    // 作为后备方案，也监听常规的导航事件
    window.addEventListener('popstate', applyTheme);
    
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
