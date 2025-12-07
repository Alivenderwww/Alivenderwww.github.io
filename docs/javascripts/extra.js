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

/* 页面加载进度监测 - 同步 MkDocs Material 内置进度条到 header 边框 */
(function() {
    const header = document.querySelector('.md-header');
    const progressBar = document.querySelector('.md-progress[data-md-component="progress"]');
    
    if (!header) return;
    
    let lastProgress = 0;
    
    // 监听进度条变化
    function syncProgress() {
        if (progressBar) {
            const progressValue = Math.min(parseFloat(progressBar.style.getPropertyValue('--md-progress-value')) || 0, 100);
            if (progressValue) {
                const progress = parseFloat(progressValue);
                
                if (progress < lastProgress) {
                    // 降低：移除动画，瞬间更新
                    header.style.transition = 'none';
                    header.style.setProperty('--load-progress', `${progress}`);
                    // 强制重排以应用无动画更新
                    header.offsetHeight;
                } else {
                    // 升高：添加缓动动画
                    header.style.transition = '--load-progress 0.3s ease-out';
                    header.style.setProperty('--load-progress', `${progress}`);
                }
                
                lastProgress = progress;
            }
        }
    }
    
    // 使用 MutationObserver 监听进度条的 style 变化
    if (progressBar) {
        const observer = new MutationObserver(() => {
            syncProgress();
        });
        
        observer.observe(progressBar, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        // 初始同步
        syncProgress();
    }
    
    // 也可以使用定时器轮询(备用方案)
    const intervalId = setInterval(() => {
        syncProgress();
    }, 500);
    
    // 页面加载完成后清理定时器
    window.addEventListener('load', () => {
        setTimeout(() => {
            clearInterval(intervalId);
            header.style.setProperty('--load-progress', '100');
            header.style.setProperty('--load-progress_noanime', '100');
        }, 500);
    });
})();


/* 鼠标样式修改 */
(function() {
    // 移动端/触摸设备检测：如果设备不支持悬停（如手机/平板），则不启用自定义鼠标
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
        return;
    }

    var wrapperId = "custom-cursor-wrapper";
    var mouseX = -100, mouseY = -100;
    var isVisible = false;
    var activeLayerIndex = 0; // 当前激活的图层索引

    function initCursor() {
        // 确保容器存在
        if (!document.getElementById(wrapperId)) {
            // 1. 创建容器 (负责位置跟随，无动画，确保跟手)
            var wrapper = document.createElement("div");
            wrapper.id = wrapperId;
            Object.assign(wrapper.style, {
                position: "fixed",
                left: "0",
                top: "0",
                width: "32px", 
                height: "32px",
                zIndex: "2147483647",
                pointerEvents: "none",
                willChange: "transform, opacity", // 性能优化
                display: "block", // 保持 block，用 opacity 控制显隐
                opacity: "0",     // 初始透明
                transition: "opacity 0.15s ease", // 显现/隐藏淡入淡出
                // 270度阴影 (垂直向下)
                filter: "drop-shadow(-1px 2px 1px rgba(39, 39, 39, 0.2))"
            });

            // 2. 创建两个图片图层用于双缓冲切换
            for (var i = 0; i < 2; i++) {
                var cursor = document.createElement("img");
                cursor.className = "custom-cursor-layer";
                // 默认第一个显示，第二个隐藏
                var initialOpacity = (i === 0) ? "1" : "0";
                Object.assign(cursor.style, {
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "100%",
                    height: "100%",
                    display: "block",
                    // 缩放动画 + 切换图标时的透明度动画
                    transition: "transform 0.1s cubic-bezier(0.17, 0.67, 0.83, 0.67), opacity 0.15s ease",
                    transform: "scale(1)",
                    opacity: initialOpacity
                });
                // 初始化 src，避免空图
                cursor.src = "/cursors/millennium_base.cur";
                wrapper.appendChild(cursor);
            }
            
            activeLayerIndex = 0;
            document.body.appendChild(wrapper);
        }
    }

    function getWrapper() { return document.getElementById(wrapperId); }
    function getLayers() { 
        var wrapper = getWrapper();
        return wrapper ? wrapper.getElementsByClassName("custom-cursor-layer") : []; 
    }

    // 初始化
    initCursor();

    // 渲染循环 (使用 requestAnimationFrame 保证流畅度)
    function render() {
        var wrapper = getWrapper();
        if (wrapper) {
            // 使用 translate3d 移动容器，减去 12px 实现居中
            wrapper.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 12}px, 0)`;
            
            // 控制显隐淡入淡出
            if (isVisible) {
                wrapper.style.opacity = "1";
            } else {
                wrapper.style.opacity = "0";
            }
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // 监听 DOM 变化，防止页面跳转后元素丢失
    var observer = new MutationObserver(function(mutations) {
        if (!document.getElementById(wrapperId)) {
            initCursor();
        }
    });
    observer.observe(document.body, { childList: true, subtree: false });

    // 处理 iframe 交互：进入 iframe 时隐藏自定义光标
    document.addEventListener("mouseover", function(e) {
        if (e.target.tagName === "IFRAME") {
            isVisible = false;
        }
    });

    // 触摸开始时隐藏自定义光标，防止在触摸设备上出现
    document.addEventListener("touchstart", function() {
        isVisible = false;
    }, { passive: true });

    // 鼠标移动
    document.addEventListener("mousemove", function(e) {
        // 如果目标是 iframe，隐藏自定义光标
        if (e.target.tagName === "IFRAME") {
            isVisible = false;
            return;
        }

        mouseX = e.clientX;
        mouseY = e.clientY;
        isVisible = true;
        
        var target = e.target;
        var cursorSrc = "/cursors/millennium_base.cur";

        // 优先级判断
        if (target.closest("a, .md-nav__link, button, .md-header__button, label[for], .md-search__input, .md-typeset a, .md-tabs__link, .md-footer__link")) {
            cursorSrc = "/cursors/millennium_link.cur";
        } else if (target.closest("input[type='text'], textarea, .md-typeset p, .md-typeset span, .md-typeset h1, .md-typeset h2, .md-typeset h3, .md-typeset h4, .md-typeset h5, .md-typeset h6, .md-typeset li, .md-typeset td, .md-typeset th, .md-typeset code, .md-typeset pre, .highlight")) {
            cursorSrc = "/cursors/millennium_text.cur";
        } else if (target.closest(":disabled, .disabled, [aria-disabled='true']")) {
            cursorSrc = "/cursors/millennium_block.cur";
        } else if (target.closest(".md-nav__title, [draggable='true']")) {
            cursorSrc = "/cursors/millennium_move.cur";
        } else if (target.closest(".md-resizer__handle--y")) {
            cursorSrc = "/cursors/millennium_NS.cur";
        } else if (target.closest(".md-resizer__handle--x")) {
            cursorSrc = "/cursors/millennium_EW.cur";
        } else if (target.closest(".nwse-resize")) {
            cursorSrc = "/cursors/millennium_diag1.cur";
        } else if (target.closest(".nesw-resize")) {
            cursorSrc = "/cursors/millennium_diag2.cur";
        } else if (target.closest(".crosshair, [data-md-component='search-query']")) {
            cursorSrc = "/cursors/millennium_areaselect.cur";
        } else if (target.closest("[title], .md-tooltip")) {
            cursorSrc = "/cursors/millennium_alternative.cur";
        }

        var layers = getLayers();
        if (layers.length > 0) {
            var activeLayer = layers[activeLayerIndex];
            // 检查是否需要切换 (使用 endsWith 匹配路径)
            if (!activeLayer.src.endsWith(cursorSrc)) {
                 var nextIndex = 1 - activeLayerIndex;
                 var nextLayer = layers[nextIndex];
                 
                 // 设置新图标并显示
                 nextLayer.src = cursorSrc;
                 nextLayer.style.opacity = "1";
                 
                 // 隐藏旧图标
                 activeLayer.style.opacity = "0";
                 
                 // 更新索引
                 activeLayerIndex = nextIndex;
            }
        }
    });

    // 鼠标离开窗口隐藏
    document.addEventListener("mouseout", function(e) {
        if (!e.relatedTarget) {
            isVisible = false;
        }
    });

    // 点击反馈 (只缩放内部图片，不影响位置)
    document.addEventListener("mousedown", function() {
        var layers = getLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].style.transform = "scale(0.8)";
        }
    });

    document.addEventListener("mouseup", function() {
        var layers = getLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].style.transform = "scale(1)";
        }
    });
})();
