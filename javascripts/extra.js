/*背景*/
// window.onload = function () {
//     //定义body的margin由默认值8px->0px
//     document.body.style.margin = "0";
//     document.body.style.background = "255,255,255";
//     //创建canvas画布
//     document.body.appendChild(document.createElement('canvas'));
//     var canvas = document.querySelector('canvas'),
//         ctx = canvas.getContext('2d') //ctx返回一个在canvas上画图的api/dom
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//     canvas.style.position = 'fixed';
//     ctx.lineWidth = .3;
//     ctx.strokeStyle = (new Color(150)).style;
//     //定义鼠标覆盖范围
//     var mousePosition = {
//         x: 30 * canvas.width / 100,
//         y: 30 * canvas.height / 100
//     };
//     var dots = {
//         nb: 1000,//Dot的总数
//         distance: 50,
//         d_radius: 100,
//         array: []
//     };
//     //创建颜色类，Color类返回字符串型rgba（*,*,*,.8）
//     function mixComponents(comp1, weight1, comp2, weight2) {
//         return (comp1 * weight1 + comp2 * weight2) / (weight1 + weight2);
//     }
//     function averageColorStyles(dot1, dot2) {
//         var color1 = dot1.color,
//             color2 = dot2.color;

//         var r = mixComponents(color1.r, dot1.radius, color2.r, dot2.radius),
//             g = mixComponents(color1.g, dot1.radius, color2.g, dot2.radius),
//             b = mixComponents(color1.b, dot1.radius, color2.b, dot2.radius);
//         return createColorStyle(Math.floor(r), Math.floor(g), Math.floor(b));
//     }
//     function colorValue(min) {
//         return Math.floor(Math.random() * 255 + min);
//     }
//     function createColorStyle(r, g, b) {
//         return 'rgba(' + r + ',' + g + ',' + b + ', 0.8)';
//     }
//     function Color(min) {
//         min = min || 0;
//         this.r = colorValue(min);
//         this.g = colorValue(min);
//         this.b = colorValue(min);
//         this.style = createColorStyle(this.r, this.g, this.b);
//     }
//     //创建Dot类以及一系列方法
//     function Dot() {
//         this.x = Math.random() * canvas.width;
//         this.y = Math.random() * canvas.height;

//         this.vx = -.5 + Math.random();
//         this.vy = -.5 + Math.random();

//         this.radius = Math.random() * 2;

//         this.color = new Color();
//     }

//     Dot.prototype = {
//         draw: function () {
//             ctx.beginPath();
//             ctx.fillStyle = this.color.style;
//             ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
//             ctx.fill();
//         }
//     };
//     function moveDots() {//Dot对象的移动
//         for (i = 0; i < dots.nb; i++) {

//             var dot = dots.array[i];

//             if (dot.y < 0 || dot.y > canvas.height) {
//                 dot.vx = dot.vx;
//                 dot.vy = - dot.vy;
//             }
//             else if (dot.x < 0 || dot.x > canvas.width) {
//                 dot.vx = - dot.vx;
//                 dot.vy = dot.vy;
//             }
//             dot.x += dot.vx;
//             dot.y += dot.vy;
//         }
//     }
//     function connectDots() {//DOt对象的连接
//         for (i = 0; i < dots.nb; i++) {
//             for (j = i; j < dots.nb; j++) {
//                 i_dot = dots.array[i];
//                 j_dot = dots.array[j];

//                 if ((i_dot.x - j_dot.x) < dots.distance && (i_dot.y - j_dot.y) < dots.distance && (i_dot.x - j_dot.x) > - dots.distance && (i_dot.y - j_dot.y) > - dots.distance) {
//                     if ((i_dot.x - mousePosition.x) < dots.d_radius && (i_dot.y - mousePosition.y) < dots.d_radius && (i_dot.x - mousePosition.x) > - dots.d_radius && (i_dot.y - mousePosition.y) > - dots.d_radius) {
//                         ctx.beginPath();
//                         ctx.strokeStyle = averageColorStyles(i_dot, j_dot);
//                         ctx.moveTo(i_dot.x, i_dot.y);
//                         ctx.lineTo(j_dot.x, j_dot.y);
//                         ctx.stroke();//绘制定义的路线
//                         ctx.closePath();//创建从当前点回到起始点的路径
//                     }
//                 }
//             }
//         }
//     }
//     function createDots() {//创建nb个Dot对象
//         for (i = 0; i < dots.nb; i++) {
//             dots.array.push(new Dot());
//         }
//     }
//     function drawDots() {//引用Dot原型链，使用draw方法，在canvas上画出Dot对象
//         for (i = 0; i < dots.nb; i++) {
//             var dot = dots.array[i];
//             dot.draw();
//         }
//     }
//     function animateDots() {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);//清除画布，否则线条会连在一起
//         moveDots();
//         connectDots();
//         drawDots();
//         requestAnimationFrame(animateDots);
//     }
//     createDots();//使用创建Dot类函数
//     requestAnimationFrame(animateDots);//使用canvas独有的60Hz刷新屏幕画布的方法

//     document.querySelector('canvas').addEventListener('mousemove', function (e) {
//         mousePosition.x = e.pageX;
//         mousePosition.y = e.pageY;
//     })

//     document.querySelector('canvas').addEventListener('mouseleave', function (e) {//鼠标离开时，连接自动返回到画布中心
//         mousePosition.x = canvas.width / 2;
//         mousePosition.y = canvas.height / 2;
//     })

// }

/* 背景end */

/* 鼠标样式修改 - 使用 Cursor.js */
(function() {
    // 移动端检测
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    // 点击状态
    document.addEventListener("mousedown", () => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) cursor.dataset.pressed = "true";
    });
    document.addEventListener("mouseup", () => {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) cursor.dataset.pressed = "false";
    });

    // 确保 Cursorjs 已加载
    if (typeof Cursorjs !== 'undefined') {
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
                }
            });
        }
    }
})();

// 页面滚动进度条
document.addEventListener("scroll", function() {
  var header = document.querySelector(".md-header");
  if (header) {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    header.style.setProperty("--load-progress", scrolled);
  }
});
