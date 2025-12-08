---
date: 2025-12-08 22:14
---

# 音频频谱捕获 - 兼容方案

> 使用 Web Audio API 实现音频频谱实时分析，支持多种音频源

## 🚀 快速开始

在浏览器控制台中输入以下命令，系统会自动选择最合适的音频源：

```javascript
await window.initAudioSpectrumV2()
```

## 📋 主要功能

### 方案 1️⃣: 自动选择最佳方案

```javascript
await window.initAudioSpectrumV2()
```

系统会按优先级尝试：
1. **🖥️ 桌面音频** - 通过屏幕共享获取系统声音
2. **🎤 麦克风** - 获取麦克风输入
3. **📝 提示用户** - 如果以上都不可用

### 方案 2️⃣: 音频文件分析

```javascript
// 使用 URL
await window.testAudioFile('https://example.com/music.mp3')

// 使用 File 对象
await window.testAudioFile(audioFileInput.files[0])

// 使用页面中的 <audio> 元素
await window.testAudioFile(document.querySelector('audio'))
```

### 方案 3️⃣: 手动连接麦克风

```javascript
const capture = new AudioSpectrumCaptureV2();
capture.initAudioContext();
await capture.connectMicrophone();
capture.startCapture((data) => {
    console.log('频谱数据:', data.stats);
});
```

### 方案 4️⃣: 手动连接桌面音频

```javascript
const capture = new AudioSpectrumCaptureV2();
capture.initAudioContext();
await capture.connectDesktopAudio();
capture.startCapture((data) => {
    console.log('频谱数据:', data.stats);
});
```

## 🎮 控制命令

| 命令 | 说明 |
|------|------|
| `await window.initAudioSpectrumV2()` | **启动频谱分析**（自动选择音源） |
| `await window.testAudioFile(url/File/element)` | **分析音频文件** |
| `window.spectrum.stopCapture()` | 停止实时分析 |
| `window.spectrum.cleanup()` | 清理所有资源 |
| `window.audioSpectrumHelp()` | 查看使用帮助 |
| `AudioSpectrumCaptureV2.checkCompatibility()` | 检查浏览器兼容性 |

## 🔍 兼容性检查

运行以下命令查看浏览器支持情况：

```javascript
AudioSpectrumCaptureV2.checkCompatibility()
```

输出示例：
```
🔍 浏览器兼容性检查:
  ✓ AudioContext: true
  ✓ getUserMedia: true
  ✓ getDisplayMedia: true
  ✓ createMediaStreamAudioSource: true
  ✓ createMediaElementAudioSource: true
  ✓ requestAnimationFrame: true
```

## 📊 频谱数据结构

### frequencyData
```
frequencyData: Uint8Array(128)
  - 128 个频率 Bin（256 FFT 的一半）
  - 每个值范围: 0-255（代表该频率的幅度）
  - 采样率: 44.1kHz（标准）
  - 频率范围: 0 ~ 22.05kHz
```

### stats（统计数据）
```javascript
{
  average: 45,        // 平均幅度
  max: 128,          // 最大幅度
  min: 0,            // 最小幅度
  lowFreq: 50,       // 低频强度 (0-85Hz)
  midFreq: 45,       // 中频强度 (85-340Hz)
  highFreq: 30,      // 高频强度 (340Hz+)
  energy: 5760,      // 总能量值（所有频率幅度之和）
  binCount: 128      // 频率 Bin 总数
}
```

## 💡 实际例子

### 例子 1: 实时麦克风分析

```javascript
// 启动
const capture = await window.initAudioSpectrumV2();

// 自定义处理频谱数据
capture.stopCapture();  // 先停止旧的
capture.startCapture((data) => {
    if (data.stats.energy > 5000) {
        console.log('🔊 声音很大!');
    } else if (data.stats.energy > 2000) {
        console.log('🔉 声音适中');
    } else {
        console.log('🔇 很安静');
    }
});

// 停止分析
window.spectrum.stopCapture();
window.spectrum.cleanup();
```

### 例子 2: 分析音乐文件

```javascript
// 方法1: 使用 URL
await window.testAudioFile('https://example.com/song.mp3');

// 让我播放一下...
// 音频会自动播放并开始分析
```

### 例子 3: 创建简单的音量指示器

```javascript
let lastEnergy = 0;
window.spectrum.stopCapture();
window.spectrum.startCapture((data) => {
    const energy = data.stats.energy;
    const change = ((energy - lastEnergy) / lastEnergy * 100).toFixed(1);
    
    console.log(`
🎵 实时音频信息
├─ 能量值: ${energy}
├─ 变化: ${change}%
├─ 平均: ${data.stats.average}
├─ 低频: ${data.stats.lowFreq}
├─ 中频: ${data.stats.midFreq}
└─ 高频: ${data.stats.highFreq}
    `);
    
    lastEnergy = energy;
});
```

## 🌐 浏览器兼容性

### 完全支持（所有功能可用）
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 90+
- ✅ Safari 14.1+
- ✅ Opera 76+

### 部分支持（某些功能可用）
- ⚠️ Safari on iOS（某些限制）
- ⚠️ Firefox Android（某些限制）

### 不支持
- ❌ IE 11 及更早版本
- ❌ 超旧的手机浏览器

## ⚠️ 常见问题

### Q: 为什么看不到频谱数据？

A: 可能的原因和解决方案：
1. **没有音频输入** - 播放音乐、视频或说话到麦克风
2. **音量太小** - 增大系统或应用程序的音量
3. **权限被拒绝** - 检查浏览器权限设置，重新授予麦克风或屏幕共享权限
4. **浏览器不支持** - 升级浏览器到最新版本

### Q: 桌面音频无法获取？

A: 这取决于您的浏览器和操作系统：
- **Chrome/Edge on Windows/Mac** - 应该支持
- **Firefox** - 需要启用实验特性
- **Safari** - 可能不支持
- **移动浏览器** - 通常不支持屏幕共享音频

### Q: 如何分析本地音乐文件？

A: 两种方法：

**方法1: 使用 URL**
```javascript
await window.testAudioFile('file:///path/to/music.mp3')
```

**方法2: 拖拽文件**
```javascript
document.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('audio/')) {
        window.testAudioFile(file);
    }
});
```

### Q: 数据更新太快或太慢？

A: 可以调整 FFT 大小和平滑系数（修改源代码）：
```javascript
// 在 initAudioContext() 中
this.analyser.fftSize = 512;          // 增加分辨率
this.analyser.smoothingTimeConstant = 0.9;  // 增加平滑
```

### Q: 能否同时分析多个音源？

A: 可以创建多个 `AudioSpectrumCaptureV2` 实例，但需要谨慎：
```javascript
const capture1 = new AudioSpectrumCaptureV2();
const capture2 = new AudioSpectrumCaptureV2();

// 分别初始化和连接
// ...
```

## 🔧 开发者选项

### 获取原始频率数据

```javascript
window.spectrum.analyser.getByteFrequencyData(window.spectrum.frequencyData);
console.log(window.spectrum.frequencyData);
```

### 修改分析器参数

```javascript
// FFT 大小（128、256、512、1024、2048、4096、8192、16384、32768）
window.spectrum.analyser.fftSize = 512;

// 平滑系数（0-1，越接近1越平滑）
window.spectrum.analyser.smoothingTimeConstant = 0.8;

// 最小/最大分贝值
window.spectrum.analyser.minDecibels = -100;
window.spectrum.analyser.maxDecibels = -10;
```

### 自定义回调处理

```javascript
window.spectrum.stopCapture();
window.spectrum.startCapture((data) => {
    // 自定义处理
    const { frequencyData, stats, timestamp } = data;
    
    // 您的代码...
});
```

## 📝 后续计划

- [ ] Canvas 频谱可视化
- [ ] 实时波形显示
- [ ] 录音功能
- [ ] 数据导出（CSV/JSON）
- [ ] 频率范围筛选
- [ ] 性能优化

---

**版本**: 2.0 (兼容方案)  
**最后更新**: 2025年12月5日  
**文件**: `docs/javascripts/audio-spectrum-v2.js`


