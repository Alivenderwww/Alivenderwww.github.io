// 页面过渡动画初始化 - 在页面加载最早期执行
// 这个脚本必须在页面头部尽早加载，以防止内容闪烁

(function() {
    'use strict';
    
    // 检查是否正在进行页面过渡
    const wasTransitioning = sessionStorage.getItem('pageTransitioning');
    
    if (wasTransitioning === 'true') {
        console.log('🎬 检测到页面过渡，立即注入关键CSS');
        
        // 立即注入关键CSS - 这比等待外部CSS文件加载更快
        const criticalStyle = document.createElement('style');
        criticalStyle.id = 'page-transition-critical';
        criticalStyle.textContent = `
            /* 页面过渡关键样式 - 立即生效 */
            html, body {
                overflow: hidden !important;
            }
            
            body > * {
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            body::after {
                content: '' !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: #425a7e !important;
                z-index: 999999 !important;
                pointer-events: none !important;
            }
            
            /* 确保overlay可见 */
            #page-transition-overlay {
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        
        // 立即插入到head的最前面
        const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
        head.insertBefore(criticalStyle, head.firstChild);
        
        // 同时添加类名作为备用
        document.documentElement.classList.add('page-transition-active');
        
        if (document.body) {
            document.body.classList.add('page-transition-active');
        } else {
            // 监听body创建
            const observer = new MutationObserver(() => {
                if (document.body) {
                    document.body.classList.add('page-transition-active');
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
        
        console.log('✅ 关键CSS已注入，页面内容已隐藏');
    }
})();
