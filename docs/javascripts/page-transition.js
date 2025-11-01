// 页面过渡动画脚本 - 完全自主控制导航
(function() {
    'use strict';
    
    let isTransitioning = false;
    
    // 创建过渡动画容器
    function createTransitionOverlay() {
        if (document.getElementById('page-transition-overlay')) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'page-transition-overlay';
        
        // 检查是否需要立即显示覆盖层
        const wasTransitioning = sessionStorage.getItem('pageTransitioning');
        if (wasTransitioning === 'true') {
            // 立即设置为覆盖状态，不使用动画
            overlay.style.transform = 'translateX(0)';
        }
        
        document.body.appendChild(overlay);
        
        // 添加CSS动画类
        if (!document.getElementById('page-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'page-transition-styles';
            style.textContent = `
                #page-transition-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--md-primary-fg-color, #425a7e);
                    transform: translateX(100%);
                    z-index: 9999;
                    pointer-events: none;
                    will-change: transform;
                }
                
                #page-transition-overlay.transition-in {
                    animation: slideIn 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
                }
                
                #page-transition-overlay.transition-out {
                    animation: slideOut 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-100%);
                    }
                }
                
                /* 页面内容淡出效果 */
                body.page-transitioning .md-content {
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                /* 页面加载时立即隐藏内容（如果正在过渡） */
                body.page-loading-transition {
                    overflow: hidden;
                }
                
                body.page-loading-transition .md-content,
                body.page-loading-transition .md-header,
                body.page-loading-transition .md-tabs {
                    opacity: 0 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 播放入场动画
    function playInAnimation() {
        const overlay = document.getElementById('page-transition-overlay');
        if (!overlay || isTransitioning) {
            console.log('⚠️ 动画已在进行中或overlay不存在');
            return Promise.resolve();
        }
        
        isTransitioning = true;
        document.body.classList.add('page-transitioning');
        
        console.log('🎬 开始播放入场动画');
        
        return new Promise((resolve) => {
            // 强制重排以确保动画触发
            overlay.offsetHeight;
            overlay.className = 'transition-in';
            
            // 等待入场动画完成
            setTimeout(() => {
                console.log('✅ 入场动画完成');
                resolve();
            }, 500);
        });
    }
    
    // 检查页面是否加载完成
    function waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        });
    }
    
    // 播放出场动画
    function playOutAnimation() {
        const overlay = document.getElementById('page-transition-overlay');
        if (!overlay) {
            console.log('⚠️ overlay不存在');
            return Promise.resolve();
        }
        
        console.log('🎬 开始播放出场动画');
        
        return new Promise((resolve) => {
            // 等待一小段时间确保页面内容已渲染
            setTimeout(() => {
                // 移除关键CSS
                const criticalStyle = document.getElementById('page-transition-critical');
                if (criticalStyle) {
                    criticalStyle.remove();
                    console.log('✅ 关键CSS已移除');
                }
                
                // 移除页面过渡状态类
                document.documentElement.classList.remove('page-transition-active');
                document.body.classList.remove('page-transition-active');
                document.body.classList.remove('page-transitioning');
                document.body.classList.remove('page-loading-transition');
                
                console.log('✅ 过渡状态类已移除');
                
                // 稍等一帧，确保内容已显示
                requestAnimationFrame(() => {
                    // 播放出场动画
                    overlay.className = 'transition-out';
                    
                    // 等待出场动画完成
                    setTimeout(() => {
                        overlay.className = '';
                        overlay.style.transform = ''; // 清除内联样式
                        isTransitioning = false;
                        console.log('✅ 出场动画完成');
                        resolve();
                    }, 500);
                });
            }, 100);
        });
    }
    
    // 拦截链接点击
    function interceptLinks() {
        document.addEventListener('click', function(e) {
            // 如果正在过渡中，阻止新的导航
            if (isTransitioning) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('⚠️ 动画进行中，阻止导航');
                return false;
            }
            
            // 查找被点击的链接元素
            let target = e.target;
            let depth = 0;
            while (target && target.tagName !== 'A' && depth < 10) {
                target = target.parentElement;
                depth++;
            }
            
            if (!target || target.tagName !== 'A') return;
            
            const href = target.getAttribute('href');
            
            // 只处理站内链接
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('http://') || 
                href.startsWith('https://') ||
                href.startsWith('mailto:') ||
                target.hasAttribute('download') ||
                target.target === '_blank') {
                return;
            }
            
            // 检查是否是站内导航链接
            const isInternalLink = href.startsWith('/') || 
                                   href.startsWith('./') || 
                                   href.startsWith('../') ||
                                   href.endsWith('.md') ||
                                   href.endsWith('.html') ||
                                   (!href.includes('://') && !href.startsWith('#'));
            
            if (isInternalLink) {
                // 阻止默认导航
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log('🔗 拦截链接点击:', href);
                
                // 计算目标URL
                let targetUrl;
                if (href.startsWith('/')) {
                    targetUrl = href;
                } else {
                    targetUrl = new URL(href, window.location.href).href;
                }
                
                // 播放入场动画，然后导航
                playInAnimation().then(() => {
                    console.log('🚀 开始导航到:', targetUrl);
                    window.location.href = targetUrl;
                });
                
                return false;
            }
        }, true); // 使用捕获阶段
        
        console.log('✅ 链接拦截器已注册');
    }
    
    // 初始化
    function init() {
        // 首先检查是否是从其他页面导航过来的
        const wasTransitioning = sessionStorage.getItem('pageTransitioning');
        
        if (wasTransitioning === 'true') {
            // 立即添加加载状态类，隐藏页面内容
            document.body.classList.add('page-loading-transition');
        }
        
        createTransitionOverlay();
        interceptLinks();
        
        // 检查是否需要播放出场动画
        if (wasTransitioning === 'true') {
            sessionStorage.removeItem('pageTransitioning');
            isTransitioning = true;
            
            const overlay = document.getElementById('page-transition-overlay');
            if (overlay) {
                // 确保overlay处于覆盖状态
                overlay.style.transform = 'translateX(0)';
            }
            
            // 等待页面加载完成后播放出场动画
            waitForPageLoad().then(() => {
                console.log('📄 新页面加载完成，准备播放出场动画');
                setTimeout(() => {
                    document.body.classList.remove('page-loading-transition');
                    playOutAnimation();
                }, 50);
            });
        }
        
        console.log('✨ 页面过渡动画已启用（独立模式）');
    }
    
    // 在导航前标记状态
    window.addEventListener('beforeunload', function() {
        if (isTransitioning) {
            sessionStorage.setItem('pageTransitioning', 'true');
        }
    });
    
    // 尽早初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
