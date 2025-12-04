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
  svg.style.mixBlendMode = "normal";
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
 * 获取随机的屏幕外起始位置（围绕屏幕中心的圆环分布）
 * @returns {{x: number, y: number}} 坐标对象
 */
function getRandomStartPosition() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  
  // 计算屏幕对角线的一半长度，确保最小半径超出屏幕
  const screenDiagonal = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
  const minRadius = screenDiagonal / 2 + 50; // 最小半径：屏幕对角线的一半 + 50px
  const maxRadius = minRadius + 500; // 最大半径
  
  // 随机角度（0 到 2π）
  const angle = Math.random() * 2 * Math.PI;
  // 随机半径（在圆环范围内）
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  
  // 计算坐标
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
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

    // 计算落点：向中心移动 60% - 80% 的距离，确保在屏幕内且不跨越中心
    const ratio = 0.55 + Math.random() * 0.3;
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
      triangle.style.rotate = `${(Math.random() - 0.5)*60}deg`;
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
const FOREGROUND_IMAGE_URL = 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/others/Shittim_logo.png';
const BACKGROUND_IMAGE_URL = 'https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/others/Shittim_back_logo.png';

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
    const imageUrl = FOREGROUND_IMAGE_URL;
    const backImageUrl = BACKGROUND_IMAGE_URL;
    
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
    
    const backImg = document.createElement('img');
    backImg.src = backImageUrl;
    backImg.style.minWidth = '100%';
    backImg.style.minHeight = '100%';
    backImg.style.objectFit = 'cover';
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
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageUrl;
    // 选择屏幕宽度的1/5、屏幕高度的1/3之中更小的那个值
    const sizeByWidth = window.innerWidth / 5;
    const sizeByHeight = window.innerHeight / 3;
    const imgSize = Math.min(sizeByWidth, sizeByHeight);
    img.style.width = imgSize + 'px';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
    
    container.appendChild(img);
    document.body.appendChild(gradientBg);
    document.body.appendChild(backImgContainer);
    document.body.appendChild(container);
    
    // 强制重绘
    img.offsetHeight;
    backImg.offsetHeight;
    gradientBg.offsetHeight;
    
    // 阶段1：scale 从 1 到 1.03，持续 0.07s
    img.style.transition = 'transform 0.07s ease-out';
    img.style.transform = 'scale(1.02)';
    backImg.style.transition = 'transform 0.07s ease-out';
    backImg.style.transform = 'scale(1.02)';
    
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
    preloadImage(FOREGROUND_IMAGE_URL),
    preloadImage(BACKGROUND_IMAGE_URL)
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
  backdrop.style.zIndex = '9998'; // 位于三角形下方
  backdrop.style.pointerEvents = 'none';
  document.body.appendChild(backdrop);
  
  // 强制重绘
  backdrop.offsetHeight;
  
  // 0.3s 内变为半透明
  backdrop.style.transition = 'opacity 0.2s linear';
  backdrop.style.opacity = '0.4';
  
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
  await Promise.all(animationPromises);
  
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
