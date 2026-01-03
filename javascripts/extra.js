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

/*背景end*/

/* 鼠标样式修改 */
(function() {
    if (window.customCursorInited) return;
    window.customCursorInited = true;

    // 移动端检测
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    // 创建容器
    const wrapper = document.createElement("div");
    wrapper.id = "cursor";
    document.body.appendChild(wrapper);

    // 光标映射配置
    const CURSORS = [
        { selector: "a, .md-nav__link, button, .md-header__button, label[for], .md-search__input, .md-typeset a, .md-tabs__link, .md-footer__link, .md-nav__title, [draggable='true'], .md-resizer__handle--y, .md-resizer__handle--x, .nwse-resize, .nesw-resize, .crosshair, [data-md-component='search-query'], [title], .md-tooltip", type: "link" },
        { selector: "input[type='text'], textarea, .md-typeset p, .md-typeset span, .md-typeset h1, .md-typeset h2, .md-typeset h3, .md-typeset h4, .md-typeset h5, .md-typeset h6, .md-typeset li, .md-typeset td, .md-typeset th, .md-typeset code, .md-typeset pre, .highlight", type: "text" }
    ];

    let isVisible = false;

    // 鼠标移动事件：更新位置和状态
    document.addEventListener("mousemove", (e) => {
        // iframe 处理
        if (e.target.tagName === "IFRAME") {
            if (isVisible) {
                isVisible = false;
                wrapper.dataset.visible = "false";
            }
            return;
        }

        wrapper.style.left = e.clientX - 5 + 'px';
        wrapper.style.top = e.clientY - 5 + 'px';

        // 显隐控制
        if (!isVisible) {
            isVisible = true;
            wrapper.dataset.visible = "true";
        }

        // 状态检测
        let type = "base";
        for (const map of CURSORS) {
            if (e.target.closest(map.selector)) {
                type = map.type;
                break;
            }
        }
        
        // 只有状态改变时才更新 DOM
        if (wrapper.dataset.type !== type) {
            wrapper.dataset.type = type;
        }
    });

    // 点击状态
    document.addEventListener("mousedown", () => wrapper.dataset.pressed = "true");
    document.addEventListener("mouseup", () => wrapper.dataset.pressed = "false");

    // 离开窗口
    document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget) {
            isVisible = false;
            wrapper.dataset.visible = "false";
        }
    });
    
    // 触摸设备隐藏
    document.addEventListener("touchstart", () => {
        isVisible = false;
        wrapper.dataset.visible = "false";
    }, { passive: true });
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
