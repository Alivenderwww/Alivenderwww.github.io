// 直接引用此 URL 浏览器会执行该 JS，将 Cursorjs 挂载到全局 window 对象上
import 'https://cdn.jsdelivr.net/gh/phucbm/cursorjs@latest/dist/cursorjs.min.js';

// 获取挂载到全局的 Cursorjs 对象
const Cursorjs = window.Cursorjs;

// 移动端检测
if (!window.matchMedia || !window.matchMedia("(hover: none)").matches) {
    // 点击状态监听
    document.addEventListener("mousedown", () => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) cursor.dataset.pressed = "true";
    });
    
    document.addEventListener("mouseup", () => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) cursor.dataset.pressed = "false";
    });

    const cursorInstance = Cursorjs.create({
        id: 'custom-cursor',
        speed: 1,
        wrapperCSS: {
            pointerEvents: 'none',
            zIndex: '2147483647'
        },
        cursorCSS: {
            width: '32px',
            height: '32px',
            background: 'transparent',
            boxShadow: 'none',        /* 遵循官方示例：去除灰圈在这里设置 */
            border: 'none',
            borderRadius: '0',
            backgroundImage: "url('/cursors/millennium_base.png')",
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            filter: 'drop-shadow(2px 2px 1px rgba(39, 39, 39, 0.2))',
            transform: 'translate(-5px, -5px)',
            transition: 'transform 0.1s',
        },
        hover: [
            {
                selectors: 'a, .md-nav__link, button, .md-header__button, label[for], .md-search__input, .md-typeset a, .md-tabs__link, .md-footer__link, .md-nav__title, [draggable="true"], .md-resizer__handle--y, .md-resizer__handle--x, .nwse-resize, .nesw-resize, .crosshair, [data-md-component="search-query"], [title], .md-tooltip',
                className: 'link'
            }
        ]
    });

    // 适配 MkDocs Material 瞬时加载 (SPA导航) 导致的失效与黏滞状态问题
    if (typeof document$ !== 'undefined') {
        document$.subscribe(function() {
            // 1. 切换页面时，清除卡住的 hover 状态
            let cw = document.getElementById('custom-cursor');
            if (cw) {
                cw.classList.remove('link', 'text', 'is-hover');
            }
            // 2. 重新为新加载的 DOM 元素绑定 mouseenter/mouseleave 事件
            if (window.CursorjsController) {
                let instance = window.CursorjsController.get('custom-cursor');
                if (instance) instance.refresh();
            } else if (cursorInstance && cursorInstance.refresh) {
                cursorInstance.refresh();
            }
        });
    }
}
