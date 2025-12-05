/**
 * 主题切换动画效果
 * 在主题切换时显示三个三角形从随机位置飞入屏幕中央的动画
 */

/**
 * 创建 SVG 三角形元素
 * @param {string} color - 三角形的颜色
 * @param {number} startX - 起始 X 坐标
 * @param {number} startY - 起始 Y 坐标
 * @param {number} size - 三角形大小
 * @returns {SVGElement} SVG 元素
 */
function createTriangle(color, startX, startY, size) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.style.position = "fixed";
  // 将坐标设置为图形中心，使用负的一半尺寸偏移
  svg.style.left = (startX - size / 2) + "px";
  svg.style.top = (startY - size / 2) + "px";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "9999";
  svg.style.mixBlendMode = "screen";
  // 设置变换原点为中心
  svg.style.transformOrigin = "center center";
  
  // 随机初始旋转
  const rotation = Math.random() * 360;
  svg.style.transform = `rotate(${rotation}deg) scale(1)`;
  svg.dataset.rotation = rotation;
  svg.dataset.size = size;

  // 创建圆角三角形的路径
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  
  // 定义圆角半径（可以根据需要调整）
  const cornerRadius = size * 0.02; // 半径为尺寸的2%
  
  // 圆角三角形路径
  const simplifiedPathData = `
    M ${size/2},${cornerRadius}
    L ${size/(1 + Math.random() * 0.2) - cornerRadius},${size - cornerRadius}
    L ${cornerRadius},${size/(1 + Math.random() * 0.2) - cornerRadius}
    Z
  `.replace(/\s+/g, ' ').trim();
  
  path.setAttribute("d", simplifiedPathData);
  
  // 使用filter添加圆角效果
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", cornerRadius * 2);
  path.setAttribute("stroke-linejoin", "round"); // 这会使角变圆
  path.setAttribute("fill", color);
  path.setAttribute("opacity", "0.95");
  
  svg.appendChild(path);
  return svg;
}

/**
 * 获取随机的屏幕外起始位置
 * @returns {{x: number, y: number}} 坐标对象
 */
function getRandomStartPosition() {
  const l = window.innerWidth;
  const h = window.innerHeight;
  const therethe = 200;
  
  // 计算总周长
  const totalPerimeter = 2 * (l + h);
  
  // 生成 0 到 totalPerimeter 之间的随机数
  const randomPos = Math.random() * totalPerimeter;
  
  let x, y;
  
  if (randomPos < l) {
    // 上边：0 到 l
    x = randomPos;
    y = -therethe;
  } else if (randomPos < l + h) {
    // 右边：l 到 l + h
    x = l + therethe;
    y = randomPos - l;
  } else if (randomPos < 2 * l + h) {
    // 下边：l + h 到 2l + h
    x = randomPos - (l + h);
    y = h + therethe;
  } else {
    // 左边：2l + h 到 2l + 2h
    x = -therethe;
    y = randomPos - (2 * l + h);
  }
  
  return { x, y };
}

/**
 * 将颜色转换为半透明的 RGBA 格式
 * @param {string} color - 颜色值 (hex 或 rgb)
 * @param {number} alpha - 透明度 (0-1)
 * @returns {string} RGBA 颜色字符串
 */
function colorToRGBA(color, alpha = 0.6) {
  // 如果已经是 rgba 格式
  if (color.startsWith('rgba')) return color;
  
  // 处理 hex 格式
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // 处理 rgb 格式
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  
  // 默认返回带透明度的颜色
  return `rgba(100, 100, 100, ${alpha})`;
}

/**
 * 将 hex 颜色转换为 HSL
 * @param {string} hex - hex 颜色值
 * @returns {{h: number, s: number, l: number}} HSL 对象
 */
function hexToHSL(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 50, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * 生成围绕主题色的随机颜色
 * @param {string} baseColor - 基础主题色 (hex)
 * @param {number} alpha - 透明度 (0-1)
 * @returns {string} HSLA 颜色字符串
 */
function getRandomVariantColor(baseColor, alpha = 0.6) {
  const hsl = hexToHSL(baseColor);
  
  // 保持色相不变，随机调整饱和度和亮度
  const h = hsl.h;
  const s = Math.max(20, Math.min(100, hsl.s - (Math.random()) * 20)); // 饱和度 -20%
  const l = Math.max(30, Math.min(80, hsl.l + (Math.random()) * 30)); // 亮度 +30%
  
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

/**
 * 动画三角形移动到中心
 * @param {SVGElement} triangle - 三角形元素
 * @param {number} centerX - 目标中心 X 坐标
 * @param {number} centerY - 目标中心 Y 坐标
 * @param {number} delay - 延迟时间 (ms)
 * @returns {Promise} 动画完成的 Promise
 */
function animateTriangle(triangle, centerX, centerY, delay) {
  return new Promise((resolve) => {
    const size = parseFloat(triangle.dataset.size);
    // 获取三角形中心点的实际坐标
    const startX = parseFloat(triangle.style.left) + size / 2;
    const startY = parseFloat(triangle.style.top) + size / 2;
    const rotation = parseFloat(triangle.dataset.rotation);

    // 计算落点：向中心移动 40% - 80% 的距离，确保在屏幕内且不跨越中心
    const ratio = 0.4 + Math.random() * 0.4;
    const targetX = startX + (centerX - startX) * ratio;
    const targetY = startY + (centerY - startY) * ratio;

    setTimeout(() => {
      // 移动：0.3s ease-out (前快后慢)
      // 缩放：0.8s ease-in (前慢后快)
      triangle.style.transition = "left 0.35s cubic-bezier(.09,.76,.21,1), top 0.35s cubic-bezier(.09,.76,.21,1), rotate 0.6s cubic-bezier(.13,.43,.19,1), scale 0.6s cubic-bezier(0.6, 0, 1, 0), opacity 0.3s linear";
      
      // 设置目标位置（减去半尺寸以保持中心对齐）
      triangle.style.left = (targetX - size / 2) + "px";
      triangle.style.top = (targetY - size / 2) + "px";
      triangle.style.opacity = "0.9";
      triangle.style.rotate = `${(Math.random() - 0.5)*75}deg`;
      // 放大动画、旋转动画
      triangle.style.scale = `1.3`;
      
      // 缩放动画结束后（0.8s）立即 resolve，不等待淡出
      setTimeout(() => {
        resolve();
        // 淡出和移除在后台进行
        triangle.style.opacity = "0";
        setTimeout(() => {
          triangle.remove();
        }, 300);
      }, 600);
    }, delay);
  });
}

/**
 * 预加载图片
 * @param {string} url - 图片 URL
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// 图片 URL 常量
const XO_IMAGE_URL = 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/others/Shittim_xo.png';

/**
 * 创建并播放 Logo 闪烁动画
 * @param {number} delay - 延迟时间 (ms)
 * @returns {Promise} 动画完成的 Promise
 */
function createAndAnimateFlashLogo(delay) {
  return new Promise((resolve) => {
    // 创建容器，与 playForegroundImageAnimation 保持一致
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.transform = 'translateY(-50%)';
    container.style.zIndex = '9998'; // 与 XO 元素同级
    container.style.pointerEvents = 'none';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.opacity = '0';

    // 计算大小
    const sizeByWidth = window.innerWidth / 5;
    const sizeByHeight = window.innerHeight / 3;
    const imgSize = Math.min(sizeByWidth, sizeByHeight);
    
    const svg = createForegroundSVG();
    svg.style.width = imgSize + 'px';
    svg.style.height = imgSize + 'px';
    svg.style.flexShrink = '0';
    
    container.appendChild(svg);
    document.body.appendChild(container);
    
    // 强制重绘
    container.offsetHeight;
    
    setTimeout(() => {
      // 淡入
      container.style.transition = 'opacity 50ms linear';
      container.style.opacity = '0.3';
      
      setTimeout(() => {
        // 淡出
        container.style.transition = 'opacity 150ms ease-out';
        container.style.opacity = '0';
        
        setTimeout(() => {
          container.remove();
          resolve();
        }, 150);
      }, 50); // 50ms 后开始淡出
    }, delay);
  });
}

/**
 * 创建并播放 XO 元素动画
 * @param {number} delay - 延迟时间 (ms)
 * @returns {Promise} 动画完成的 Promise
 */
function createAndAnimateXO(delay) {
  return new Promise((resolve) => {
    const baseSize = Math.min(window.innerWidth, window.innerHeight);
    const size1 = baseSize / 2;
    const size2 = baseSize / 3;
    
    // 创建元素1
    const el1 = document.createElement('img');
    el1.src = XO_IMAGE_URL;
    el1.style.position = 'fixed';
    el1.style.width = size1 + 'px';
    el1.style.height = 'auto';
    el1.style.top = '50%';
    el1.style.left = -size1 + 'px'; // 屏幕外左侧
    el1.style.transform = 'translateY(-50%)';
    el1.style.zIndex = '9998'; // 在三角形(9999)后面
    el1.style.pointerEvents = 'none';
    el1.style.opacity = '0';
    
    // 创建元素2
    const el2 = document.createElement('img');
    el2.src = XO_IMAGE_URL;
    el2.style.position = 'fixed';
    el2.style.width = size2 + 'px';
    el2.style.height = 'auto';
    el2.style.top = '50%';
    el2.style.left = window.innerWidth + 'px'; // 屏幕外右侧
    el2.style.transform = 'translateY(-50%)';
    el2.style.zIndex = '9998'; // 在三角形(9999)后面
    el2.style.pointerEvents = 'none';
    el2.style.opacity = '0';
    
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    
    // 强制重绘
    el1.offsetHeight;
    el2.offsetHeight;
    
    setTimeout(() => {
      // 位移动画
      const moveTransition = 'left 0.35s cubic-bezier(.09,.76,.21,1)';
      
      // 目标位置
      const targetX1 = window.innerWidth * 0.4 - size1 / 2;
      const targetX2 = window.innerWidth * 0.6 - size2 / 2; // 靠右2/5 = 靠左3/5
      
      el1.style.left = targetX1 + 'px';
      el2.style.left = targetX2 + 'px';
      
      // 透明度闪烁动画
      let elapsedTime = 0;
      const flickerInterval = 10;
      const flickerDuration = 200;
      
      const intervalId = setInterval(() => {
        elapsedTime += flickerInterval;
        
        // 随机透明度
        const randomOpacity = Math.random();
        
        // 更新 transition 和 opacity
        // 注意：需要保留 left 的 transition
        el1.style.transition = `${moveTransition}, opacity 10ms linear`;
        el2.style.transition = `${moveTransition}, opacity 10ms linear`;
        
        el1.style.opacity = randomOpacity;
        el2.style.opacity = randomOpacity;
        
        if (elapsedTime >= flickerDuration) {
          clearInterval(intervalId);
          
          // 最后阶段：淡出
          setTimeout(() => {
            el1.style.transition = `${moveTransition}, opacity 200ms linear`;
            el2.style.transition = `${moveTransition}, opacity 200ms linear`;
            el1.style.opacity = '0';
            el2.style.opacity = '0';
            
            // 移除元素
            setTimeout(() => {
              el1.remove();
              el2.remove();
              resolve();
            }, 200);
          }, 10); // 等待最后一次闪烁完成
        }
      }, flickerInterval);
      
      // 立即执行第一次闪烁
      el1.style.transition = `${moveTransition}, opacity 10ms linear`;
      el2.style.transition = `${moveTransition}, opacity 10ms linear`;
      el1.style.opacity = Math.random() * 0.5;
      el2.style.opacity = Math.random() * 0.5;
      
    }, delay);
  });
}

/**
 * 创建背景 SVG 元素
 * @returns {SVGElement} SVG 元素
 */
function createBackgroundSVG() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 803.46 302.26");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  const polygonPoints = [
    "253.56 73.77 177.99 204.65 329.12 204.65",
    "301.22 73.77 225.66 204.65 376.79 204.65",
    "411.1 0 335.53 130.88 486.66 130.88",
    "464.12 92.89 388.56 223.77 539.69 223.77",
    "419.12 171.38 343.55 302.26 494.68 302.26",
    "201.28 164.67 125.72 295.55 276.85 295.55",
    "201.28 245.47 276.85 114.59 125.72 114.59",
    "245.43 168.57 276.85 114.16 214.02 114.16",
    "486.66 131.41 518.08 77 455.25 77",
    "518.08 185.54 549.49 131.13 486.66 131.13",
    "309.96 139.21 234.4 270.09 385.52 270.09",
    "342.61 303.53 390.24 221.03 294.98 221.03",
    "411.1 77.74 380.54 130.67 441.66 130.67",
    "419.12 170.84 388.56 223.77 449.67 223.77",
    "133.53 199.34 219.81 49.9 47.26 49.9",
    "177.99 122.56 75.35 300.35 280.64 300.35",
    "507.52 73.77 431.96 204.65 583.09 204.65",
    "555.19 73.77 479.62 204.65 630.75 204.65",
    "665.06 0 589.5 130.88 740.63 130.88",
    "718.09 92.89 642.52 223.77 793.65 223.77",
    "673.08 171.38 597.52 302.26 748.65 302.26",
    "455.25 164.67 379.69 295.55 530.81 295.55",
    "455.25 245.47 530.81 114.59 379.69 114.59",
    "499.4 168.57 530.82 114.16 467.98 114.16",
    "740.63 131.41 772.04 77 709.21 77",
    "772.04 185.54 803.46 131.13 740.63 131.13",
    "563.93 139.21 488.36 270.09 639.49 270.09",
    "596.57 303.53 644.21 221.03 548.94 221.03",
    "665.06 77.74 634.51 130.67 695.62 130.67",
    "673.08 170.84 642.52 223.77 703.64 223.77",
    "387.5 199.34 473.77 49.9 301.22 49.9",
    "431.96 122.56 329.31 300.35 534.61 300.35",
    "75.56 0 0 130.88 151.13 130.88",
    "128.59 92.89 53.02 223.77 204.15 223.77",
    "83.58 171.38 8.02 302.26 159.15 302.26",
    "151.13 131.41 182.54 77 119.71 77",
    "182.54 185.54 213.96 131.13 151.13 131.13",
    "75.56 77.74 45.01 130.67 106.12 130.67",
    "83.58 170.84 53.02 223.77 114.14 223.77"
  ];
  
  polygonPoints.forEach(p => {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", p);
    poly.setAttribute("fill", "white");
    poly.setAttribute("opacity", "0.1");
    g.appendChild(poly);
  });
  
  svg.appendChild(g);
  return svg;
}

/**
 * 创建前景 Logo SVG 元素
 * @returns {SVGElement} SVG 元素
 */
function createForegroundSVG() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 125.54 125.54");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  
  // 样式
  svg.style.display = 'block';
  svg.style.transform = 'scale(1)';
  svg.style.transformOrigin = 'center center';
  
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // 外圈圆环
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M62.77,0C28.11,0,0,28.11,0,62.77s28.11,62.78,62.77,62.78,62.78-28.11,62.78-62.78S97.44,0,62.77,0ZM62.77,120.75c-32.02,0-57.97-25.96-57.97-57.98S30.76,4.8,62.77,4.8s57.98,25.96,57.98,57.97-25.96,57.98-57.98,57.98Z");
  path.setAttribute("fill", "white");
  path.setAttribute("opacity", "0.5");
  g.appendChild(path);
  
  // 内部多边形
  const points = [
    "30.07 29.85 40.72 13.2 83.32 13.2 94.27 29.85 30.07 29.85",
    "72.52 30.6 83.1 46.65 93.75 30.6 72.52 30.6",
    "51.45 29.85 40.65 46.2 61.72 78 72.52 62.05 51.45 29.85",
    "73.42 62.77 62.77 78.9 73.42 95.25 52.5 95.25 41.92 79.01 31.27 95.25 42.15 111.68 84.3 111.68 94.87 95.33 73.42 62.77"
  ];
  
  points.forEach(p => {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", p);
    poly.setAttribute("fill", "white");
    g.appendChild(poly);
  });
  
  svg.appendChild(g);
  return svg;
}

/**
 * 播放前景图片动画
 * @param {string} themeColor - 主题色，用于选择渐变背景
 * @param {Promise<HTMLImageElement>[]} preloadedImages - 预加载的图片 Promise 数组
 * @returns {Promise} 动画完成的 Promise
 */
async function playForegroundImageAnimation(themeColor, preloadedImages = []) {
  // 等待图片预加载完成
  try {
    await Promise.all(preloadedImages);
  } catch (e) {
    console.warn('Image preload failed, continuing anyway:', e);
  }
  
  return new Promise((resolve) => {
    // 根据主题色选择渐变背景
    let gradientBackground;
    if (themeColor === '#5fbeeb' || themeColor === '#42a5f5') {
      // 蓝色主题
      gradientBackground = 'linear-gradient(to bottom right, #BDEDFE, #F4E9F9)';
    } else if (themeColor === '#a569bd' || themeColor === '#ab47bc') {
      // 紫色主题
      gradientBackground = 'linear-gradient(to bottom right, #cdc6fa, #f8e9fc)';
    } else {
      // 默认渐变
      gradientBackground = 'linear-gradient(to bottom right, #BDEDFE, #F4E9F9)';
    }
    
    // 创建渐变背景容器
    const gradientBg = document.createElement('div');
    gradientBg.style.position = 'fixed';
    gradientBg.style.top = '50%';
    gradientBg.style.left = '0';
    gradientBg.style.width = '100vw';
    gradientBg.style.height = '100vh';
    gradientBg.style.transform = 'translateY(-50%)';
    gradientBg.style.background = gradientBackground;
    gradientBg.style.zIndex = '10000';
    gradientBg.style.pointerEvents = 'none';
    
    // 创建背景图片容器（铺满屏幕）
    const backImgContainer = document.createElement('div');
    backImgContainer.style.position = 'fixed';
    backImgContainer.style.top = '50%';
    backImgContainer.style.left = '0';
    backImgContainer.style.width = '100vw';
    backImgContainer.style.height = '100vh';
    backImgContainer.style.transform = 'translateY(-50%)';
    backImgContainer.style.zIndex = '10001';
    backImgContainer.style.pointerEvents = 'none';
    backImgContainer.style.overflow = 'hidden';
    backImgContainer.style.display = 'flex';
    backImgContainer.style.alignItems = 'center';
    backImgContainer.style.justifyContent = 'center';
    
    const backImg = createBackgroundSVG();
    backImg.style.width = '100%';
    backImg.style.height = '100%';
    backImg.style.transform = 'scale(1)';
    backImg.style.transformOrigin = 'center center';
    
    backImgContainer.appendChild(backImg);
    
    // 创建前景图片容器
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.transform = 'translateY(-50%)';
    container.style.zIndex = '10002';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    
    // 创建前景 SVG 元素
    const sizeByWidth = window.innerWidth / 5;
    const sizeByHeight = window.innerHeight / 3;
    const imgSize = Math.min(sizeByWidth, sizeByHeight);
    
    const img = createForegroundSVG();
    img.style.width = imgSize + 'px';
    img.style.height = imgSize + 'px';
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
    
    container.appendChild(img);
    document.body.appendChild(gradientBg);
    document.body.appendChild(backImgContainer);
    document.body.appendChild(container);
    
    // 强制重绘
    // img.offsetHeight; // SVG element
    backImg.offsetHeight;
    gradientBg.offsetHeight;
    
    // 阶段1：scale 从 1 到 1.04，持续 0.07s
    img.style.transition = 'transform 0.07s ease-out';
    img.style.transform = 'scale(1.04)';
    backImg.style.transition = 'transform 0.07s ease-out';
    backImg.style.transform = 'scale(1.04)';
    
    setTimeout(() => {
      // 阶段2：等待 0.5s
      setTimeout(() => {
        // 阶段3：向中间压扁，持续 0.07s，使用 scaleY 而不是 height
        container.style.transition = 'transform 0.07s linear';
        container.style.transform = 'translateY(-50%) scaleY(0)';
        backImgContainer.style.transition = 'transform 0.07s linear';
        backImgContainer.style.transform = 'translateY(-50%) scaleY(0)';
        gradientBg.style.transition = 'transform 0.07s linear';
        gradientBg.style.transform = 'translateY(-50%) scaleY(0)';
        
        setTimeout(() => {
          // 动画完成，移除元素
          container.remove();
          backImgContainer.remove();
          gradientBg.remove();
          resolve();
        }, 200);
      }, 500);
    }, 200);
  });
}

/**
 * 播放主题切换动画
 * @param {string} themeColor - 目标主题色
 * @param {Function} switchCallback - 切换主题的回调函数
 * @returns {Promise} 动画完成的 Promise
 */
async function playThemeSwitchAnimation(themeColor, switchCallback) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  // 立即开始预加载图片（在三角形动画期间下载）
  const imagePreloadPromises = [
    preloadImage(XO_IMAGE_URL)
  ];

  // 创建并播放背景变暗动画
  const backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100vw';
  backdrop.style.height = '100vh';
  backdrop.style.backgroundColor = 'black';
  backdrop.style.opacity = '0';
  backdrop.style.zIndex = '9997'; // 位于 XO 元素(9998)下方
  backdrop.style.pointerEvents = 'none';
  document.body.appendChild(backdrop);
  
  // 强制重绘
  backdrop.offsetHeight;
  
  // 0.3s 内变为半透明
  backdrop.style.transition = 'opacity 0.2s linear';
  backdrop.style.opacity = '0.4';
  
  // 播放 XO 动画 (延迟 100ms 与三角形同步)
  const xoAnimationPromise = createAndAnimateXO(100);
  
  // 播放 Logo 闪烁动画 (延迟 100ms 与三角形同步)
  const flashLogoPromise = createAndAnimateFlashLogo(100, themeColor);

  // 创建11个三角形
  const triangles = [];
  const triangleSizes = [60, 80, 100, 130, 150, 180, 190, 220, 260, 300, 350]; // 不同的三角形大小
  
  for (let i = 0; i < 11; i++) {
    const startPos = getRandomStartPosition();
    // 为每个三角形生成围绕主题色的随机颜色变体
    const triangleColor = getRandomVariantColor(themeColor, 1);
    const triangle = createTriangle(triangleColor, startPos.x, startPos.y, triangleSizes[i]);
    document.body.appendChild(triangle);
    triangles.push(triangle);
  }
  
  // 启动所有三角形动画,每个有不同的延迟
  const animationPromises = triangles.map((triangle, index) => 
    animateTriangle(triangle, centerX, centerY, 100)
  );
  
  // 在动画中途切换主题
  setTimeout(() => {
    if (switchCallback) {
      switchCallback();
    }
  }, 1200);
  
  // 等待所有三角形动画完成
  await Promise.all([...animationPromises, xoAnimationPromise, flashLogoPromise]);
  
  // 背景和三角形一起淡出
  backdrop.style.transition = 'opacity 0.3s linear';
  backdrop.style.opacity = '0';
  setTimeout(() => {
    backdrop.remove();
  }, 300);

  // 播放前景图片动画（传入预加载的图片）
  await playForegroundImageAnimation(themeColor, imagePreloadPromises);
}

/**
 * 获取主题对应的颜色
 * @param {string} themeName - 主题名称
 * @returns {string} 主题色
 */
function getThemeColor(themeName) {
  const themeColors = {
    'red': '#ef5350',
    'pink': '#e91e63',
    'purple': '#ab47bc',
    'deep-purple': '#7e57c2',
    'indigo': '#5c6bc0',
    'blue': '#42a5f5',
    'light-blue': '#29b6f6',
    'cyan': '#26c6da',
    'teal': '#26a69a',
    'green': '#66bb6a',
    'light-green': '#9ccc65',
    'lime': '#d4e157',
    'yellow': '#ffee58',
    'amber': '#ffca28',
    'orange': '#ffa726',
    'deep-orange': '#ff7043',
    'brown': '#8d6e63',
    'grey': '#bdbdbd',
    'blue-grey': '#78909c',
    'black': '#000000',
    'white': '#ffffff'
  };
  
  return themeColors[themeName] || '#42a5f5'; // 默认返回蓝色
}

// 将函数绑定到全局对象
window.playThemeSwitchAnimation = playThemeSwitchAnimation;
window.getThemeColor = getThemeColor;
