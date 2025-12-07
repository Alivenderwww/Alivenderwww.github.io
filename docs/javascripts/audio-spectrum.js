/**
 * 音频频谱捕获模块 - 简化版
 * 仅使用 getDisplayMedia 捕获屏幕/窗口的音频
 */

class AudioSpectrumCapture {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.animationId = null;
        this.frequencyData = null;
        this.isRunning = false;
        this.sourceNode = null;
        this.container = null;
        this.canvas = null;
        this.frameCounter = 0;  // 用于控制绘制间隔
        this.drawInterval = 1;  // 默认每帧绘制，可设置为 2、3、5 等
        
        // 历史帧数据：存储最近三帧的频谱数据用于变化检测
        this.bandValuesHistory = [];  // 存储最近三帧的 bandValues
        
        // 默认配置
        this.settings = {
            fftSize: 2048,
            smoothingTimeConstant: 0.6,
            segments: 64
        };
    }

    /**
     * 更新配置
     */
    updateSettings(key, value) {
        if (key === 'fftSize') {
            this.settings.fftSize = parseInt(value);
            if (this.analyser) {
                this.analyser.fftSize = this.settings.fftSize;
                this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
                console.log(`fft-size updated to: ${this.settings.fftSize}`);
            }
        } else if (key === 'smoothingTimeConstant') {
            this.settings.smoothingTimeConstant = parseFloat(value);
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = this.settings.smoothingTimeConstant;
                console.log(`smoothing-time updated to: ${this.settings.smoothingTimeConstant}`);
            }
        } else if (key === 'segments') {
            this.settings.segments = parseInt(value);
            console.log(`segments updated to: ${this.settings.segments}`);
        }
    }

    /**
     * 初始化音频上下文
     */
    initAudioContext() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.error('not support AudioContext');
                return false;
            }

            this.audioContext = new AudioContextClass();

            // 恢复音频上下文
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // 创建分析器
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.settings.fftSize;
            this.analyser.smoothingTimeConstant = this.settings.smoothingTimeConstant;

            const bufferLength = this.analyser.frequencyBinCount;
            this.frequencyData = new Uint8Array(bufferLength);

            console.log('audio init done');
            console.log(`sampleRate: ${this.audioContext.sampleRate}Hz`);
            console.log(`fftSize: ${this.analyser.fftSize}`);
            console.log(`bufferLength: ${bufferLength}`);

            return true;
        } catch (error) {
            console.error('audio init error:', error.message);
            return false;
        }
    }

    /**
     * 获取屏幕/窗口音频流
     */
    async getDisplayAudio() {
        try {
            if (!navigator.mediaDevices.getDisplayMedia) {
                console.error('not support getDisplayMedia');
                return false;
            }

            // 重要：必须同时请求 video 和 audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,  // 必须为 true
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    sampleRate: 44100,
                    suppressLocalAudioPlayback: false,
                },   // 启用音频
            });

            if (!displayStream.getAudioTracks().length) {
                console.error('audio track not found');
                displayStream.getTracks().forEach(track => track.stop());
                return false;
            }

            console.log('audio stream get');

            // 创建媒体流源
            if (typeof this.audioContext.createMediaStreamSource === 'function') {
                this.sourceNode = this.audioContext.createMediaStreamSource(displayStream);
                this.sourceNode.connect(this.analyser);
                console.log('audio source connected');
            } else {
                console.error('not support createMediaStreamSource');
                displayStream.getTracks().forEach(track => track.stop());
                return false;
            }

            this.mediaStream = displayStream;

            // 监听流停止事件
            displayStream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log('screen sharing stopped');
                    this.stopCapture();
                    this.cleanup();
                    this.hideSpectrumPanel();
                    
                    // 重置频谱按钮的状态
                    const spectrumButton = document.getElementById('spectrum-button');
                    if (spectrumButton) {
                        spectrumButton.setAttribute('title', '启动音频频谱');
                        spectrumButton.removeAttribute('data-spectrum-active');
                    }
                    
                    window.audioSpectrum = null;
                };
            });

            return true;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
            } else {
                console.error('retrieve screen audio error', error.message);
            }
            return false;
        }
    }

    /**
     * 设置绘制间隔
     * @param {number} interval - 每隔多少帧绘制一次，1 表示每帧绘制，2 表示隔 1 帧绘制等
     */
    setDrawInterval(interval) {
        this.drawInterval = Math.max(1, Math.floor(interval));
        console.log(`setDrawInterval: ${this.drawInterval} frames`);
    }

    /**
     * 绘制频谱柱状图（使用对数坐标）- 竖排版本
     * @param {number} startFreq - 起始频率 (Hz)，默认 20
     * @param {number} endFreq - 结束频率 (Hz)，默认 20000
     * @param {number} segments - 频段数量，默认 64
     */
    drawSpectrum(startFreq = 20, endFreq = 20000, segments = 64) {
        if (!this.canvas || !this.frequencyData) return;

        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 获取音频参数
        const totalBins = this.frequencyData.length;
        const binWidth = (22050 - 0) / (totalBins * 2);

        const logStart = Math.log10(startFreq);
        const logEnd = Math.log10(endFreq);
        const logRange = logEnd - logStart;
        
        // 使用配置的 segments
        segments = this.settings.segments;
        
        // 动态计算 barHeight 以适应高度
        const barHeight = (height / segments * 0.9);
        
        const bands = [];
        
        for (let i = 0; i < segments; i++) {
            const logStartPos = logStart + (i / segments) * logRange;
            const logEndPos = logStart + ((i + 1) / segments) * logRange;

            const freqStart = Math.pow(10, logStartPos);
            const freqEnd = Math.pow(10, logEndPos);

            const startBin = Math.floor(freqStart / binWidth);
            const endBin = Math.ceil(freqEnd / binWidth);

            const validStartBin = Math.max(0, Math.min(startBin, totalBins - 1));
            const validEndBin = Math.max(validStartBin + 1, Math.min(endBin, totalBins));

            bands.push({
                startBin: validStartBin,
                endBin: validEndBin,
                binCount: validEndBin - validStartBin
            });
        }

        // 调整 bins
        bands.forEach(band => {
            if (band.binCount < 1) {
                band.endBin = Math.min(band.startBin + 1, totalBins);
                band.binCount = band.endBin - band.startBin;
            }
        });

        // 计算值
        const bandValues = new Array(segments).fill(0);
        for (let i = 0; i < segments; i++) {
            const band = bands[i];
            if (band.binCount === 0) continue;

            let sum = 0;
            let max = 0;
            for (let bin = band.startBin; bin < band.endBin && bin < totalBins; bin++) {
                sum += this.frequencyData[bin];
                max = (this.frequencyData[bin] > max)?(this.frequencyData[bin]):(max);
            }
            bandValues[i] = sum / band.binCount;
            bandValues[i] = max;
        }

        // 平滑处理：对每个值取其自身和周围四个值（左三右三）的加权平均值
        const weights = [0.03, 0.07, 0.1, 0.6, 0.1, 0.07, 0.03];
        const smoothedValues = new Array(segments).fill(0);
        for (let i = 0; i < segments; i++) {
            let smoothedValue = 0;
            for (let j = -3; j <= 3; j++) {
                const index = i + j;
                // 处理边界：超出范围时使用边界值
                const clampedIndex = Math.max(0, Math.min(index, segments - 1));
                smoothedValue += bandValues[clampedIndex] * weights[j + 3];
            }
            smoothedValues[i] = smoothedValue;
        }
        
        // 替换原始值为平滑后的值
        for (let i = 0; i < segments; i++) {
            bandValues[i] = smoothedValues[i];
        }

        // 记录当前帧数据到历史记录中（保持最近三帧）
        this.bandValuesHistory.push([...bandValues]);
        if (this.bandValuesHistory.length > 3) {
            this.bandValuesHistory.shift();  // 移除最旧的帧
        }

        // 获取 CSS 变量颜色 - 从应用主题的元素上获取
        const themedElement = document.querySelector('[data-md-color-primary]');
        
        // 获取主题蓝色
        let primaryBlueColor = '';
        if (themedElement) {
            primaryBlueColor = getComputedStyle(themedElement).getPropertyValue('--md-primary-blue').trim();
        }
        
        // 获取 --md-primary-text 颜色作为变化指示颜色
        let primaryTextColor = '';
        if (themedElement) {
            const primaryTextStyle = getComputedStyle(themedElement).getPropertyValue('--md-primary-text').trim();
            if (primaryTextStyle) {
                primaryTextColor = primaryTextStyle;
            }
        }
        
        // 绘制
        const cornerRadius = barHeight/2; // 圆角半径
        for (let i = 0; i < segments; i++) {
            const value = bandValues[segments - i - 1];
            const barLength = (value / 255) * width; 
            
            // y 坐标：低频在上
            const y = height * (1 - (i + 1) / (segments));
            
            // 检查三帧中该频谱条的变化
            // 计算最近三帧中该条的最大值和最小值
            let maxValue = value;
            let minValue = value;
            for (let frameIdx = 0; frameIdx < this.bandValuesHistory.length; frameIdx++) {
                const historyValue = this.bandValuesHistory[frameIdx][segments - i - 1];
                maxValue = Math.max(maxValue, historyValue);
                minValue = Math.min(minValue, historyValue);
            }
            
            // 根据变化幅度选择颜色
            let rgbColor_16;
            let rgbColor = [0, 0, 0];
            let alpha;
            if (maxValue - minValue > 20) {
                // 变化大：使用 --md-primary-text 颜色
                rgbColor_16 = primaryTextColor;
                alpha = (value / 255).toFixed(2) * 1.2;
            } else {
                // 变化小：使用主题蓝色
                rgbColor_16 = primaryBlueColor;
                alpha = (value / 255).toFixed(2);
            }

            if (rgbColor_16.startsWith('#')) {
                let hex = rgbColor_16.slice(1);
                // 提取 RGB 值
                rgbColor[0] = parseInt(hex.substring(0, 2), 16);
                rgbColor[1] = parseInt(hex.substring(2, 4), 16);
                rgbColor[2] = parseInt(hex.substring(4, 6), 16);
            }

            ctx.fillStyle = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, ${alpha})`;
            
            // 使用 roundRect 绘制带圆角的矩形
            if (barLength > 0) {
                ctx.beginPath();
                // 左下角
                ctx.moveTo(-cornerRadius, y + barHeight);
                // 左上角
                ctx.lineTo(-cornerRadius, y);
                // 右上角
                ctx.lineTo(barLength-cornerRadius, y);
                // 端点圆弧
                ctx.arcTo(barLength, y, barLength, y + cornerRadius, cornerRadius);
                // 右下角
                ctx.arcTo(barLength, y + barHeight, barLength - cornerRadius, y + barHeight, cornerRadius);
                // 左下角
                ctx.lineTo(-cornerRadius, y + barHeight);
                ctx.fill();
            }
        }
    }

    /**
     * 启动频谱捕获
     */
    startCapture() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const captureFrame = () => {
            if (!this.isRunning) return;

            this.analyser.getByteFrequencyData(this.frequencyData);

            // 按照间隔绘制频谱
            if (this.frameCounter % this.drawInterval === 0) {
                this.drawSpectrum(40, 12000, this.settings.segments);
            }
            this.frameCounter++;

            this.animationId = requestAnimationFrame(captureFrame);
        };

        captureFrame();
    }

    /**
     * 停止捕获
     */
    stopCapture() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stopCapture();

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.frequencyData = null;
    }

    /**
     * 创建频谱面板
     */
    createSpectrumPanel() {
        if (this.container) return;

        // 获取布局信息
        const header = document.querySelector('.md-header');
        const mainInner = document.querySelector('.md-main__inner');
        
        const headerHeight = header ? header.offsetHeight : 0;
        
        // 计算宽度：从屏幕左边到 mainInner 的左边
        let availableWidth = 0;
        if (mainInner) {
            const rect = mainInner.getBoundingClientRect();
            availableWidth = rect.left;
        } else {
            availableWidth = window.innerWidth * 0.15;
        }
        
        // 限制最大宽度，避免太宽
        if (availableWidth > 400) availableWidth = 400;
        if (availableWidth < 50) availableWidth = 50; // 最小宽度

        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'audio-spectrum-panel';
        this.container.style.cssText = `
            position: fixed;
            top: ${headerHeight}px;
            left: 0;
            bottom: 0;
            width: ${availableWidth}px;
            z-index: 1; 
            pointer-events: none;
            overflow: hidden;
        `;

        // Canvas 用于绘制频谱
        this.canvas = document.createElement('canvas');
        this.canvas.width = availableWidth;
        this.canvas.height = window.innerHeight - headerHeight;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;

        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
        
        // 监听窗口大小变化以调整 canvas
        this.resizeHandler = () => {
            if (!this.container || !this.canvas) return;
            
            const newHeaderHeight = header ? header.offsetHeight : 0;
            let newWidth = 0;
            if (mainInner) {
                const rect = mainInner.getBoundingClientRect();
                newWidth = rect.left;
            } else {
                newWidth = window.innerWidth * 0.15;
            }
            
            if (newWidth > 300) newWidth = 300;
            if (newWidth < 50) newWidth = 50;

            this.container.style.top = `${newHeaderHeight}px`;
            this.container.style.width = `${newWidth}px`;
            this.canvas.width = newWidth;
            this.canvas.height = window.innerHeight - newHeaderHeight;
        };
        
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * 隐藏频谱面板
     */
    hideSpectrumPanel() {
        if (this.container) {
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                    this.container = null;
                    this.canvas = null;
                }
            }, 300);
        }
    }

    /**
     * 启动频谱分析
     */
    async start() {
        // 初始化音频上下文
        if (!this.initAudioContext()) {
            return false;
        }

        // 获取屏幕音频
        if (!await this.getDisplayAudio()) {
            return false;
        }

        // 创建并显示频谱面板
        this.createSpectrumPanel();

        // 启动捕获
        this.startCapture();

        return true;
    }
}

/**
 * 全局实例
 */
window.audioSpectrum = null;

/**
 * 启动按钮函数
 */
window.startAudioSpectrum = async function() {
    if (window.audioSpectrum && window.audioSpectrum.isRunning) {
        return false;
    }

    window.audioSpectrum = new AudioSpectrumCapture();
    return await window.audioSpectrum.start();
};

/**
 * 停止函数
 */
window.stopAudioSpectrum = function() {
    if (window.audioSpectrum) {
        window.audioSpectrum.stopCapture();
        window.audioSpectrum.cleanup();
        window.audioSpectrum.hideSpectrumPanel();
        window.audioSpectrum = null;
    }
};

/**
 * 初始化频谱按钮的菜单和事件处理
 */
function initSpectrumButton() {
    const button = document.getElementById('spectrum-button');
    const menu = document.getElementById('spectrum-config-menu');
    const buttonContainer = document.getElementById('spectrum-button-container');
    
    if (!button || !menu || !buttonContainer) return;

    // 辅助函数：更新滑块背景（实现已激活部分的颜色填充）
    const updateSliderBackground = (slider) => {
        const min = parseFloat(slider.min || 0);
        const max = parseFloat(slider.max || 100);
        const val = parseFloat(slider.value);
        const percentage = (val - min) * 100 / (max - min);
        
        slider.style.background = `linear-gradient(to right, 
            var(--md-accent-fg-color, var(--md-primary-fg-color)) 0%, 
            var(--md-accent-fg-color, var(--md-primary-fg-color)) ${percentage}%, 
            var(--md-default-fg-color--lightest) ${percentage}%, 
            var(--md-default-fg-color--lightest) 100%)`;
    };

    // 事件监听：显示/隐藏菜单
    let hideTimeout;
    
    const showMenu = () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        menu.style.visibility = 'visible';
        menu.style.opacity = '1';
        menu.style.transform = 'translateX(-50%) translateY(0)';
    };
    
    const hideMenu = () => {
        hideTimeout = setTimeout(() => {
            menu.style.opacity = '0';
            menu.style.transform = 'translateX(-50%) translateY(-10px)';
            menu.style.visibility = 'hidden';
        }, 300);
    };

    buttonContainer.addEventListener('mouseenter', showMenu);
    buttonContainer.addEventListener('mouseleave', hideMenu);

    // 滑块事件监听
    const fftSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    
    const fftSlider = document.getElementById('fft-slider');
    const segSlider = document.getElementById('seg-slider');
    const smoothSlider = document.getElementById('smooth-slider');
    
    const fftValueInput = document.getElementById('fft-value');
    const segValueInput = document.getElementById('seg-value');
    const smoothValueInput = document.getElementById('smooth-value');
    
    // 初始化输入框的值（从 AudioSpectrumCapture 的默认 settings）
    const tempCapture = new AudioSpectrumCapture();
    fftValueInput.value = tempCapture.settings.fftSize;
    segValueInput.value = tempCapture.settings.segments;
    smoothValueInput.value = tempCapture.settings.smoothingTimeConstant.toFixed(2);

    // 处理输入值的函数
    const handleValueInput = (input, slider, possibleValues, isFloat = false) => {
        const confirmInput = () => {
            let inputValue = input.value.trim();
            let finalValue;
            
            if (isFloat) {
                const numValue = parseFloat(inputValue);
                if (isNaN(numValue)) {
                    finalValue = parseFloat(input.defaultValue || slider.value);
                } else {
                    const min = parseFloat(slider.min || 0);
                    const max = parseFloat(slider.max || 1);
                    finalValue = Math.max(min, Math.min(max, numValue));
                }
            } else {
                const numValue = parseInt(inputValue);
                if (isNaN(numValue)) {
                    finalValue = parseInt(input.defaultValue || slider.value);
                } else {
                    finalValue = possibleValues.reduce((prev, curr) => 
                        Math.abs(curr - numValue) < Math.abs(prev - numValue) ? curr : prev
                    );
                }
            }
            
            // 设置slider的新值
            if (slider === fftSlider) {
                const index = fftSizes.indexOf(finalValue);
                if (index !== -1) {
                    slider.value = index;
                }
            } else {
                slider.value = finalValue;
            }
            slider.dispatchEvent(new Event('input'));
        };
        
        input.addEventListener('blur', confirmInput);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') confirmInput();
        });
    };
    
    if (fftSlider) {
        // 设置初始值：找到对应的索引
        const fftIndex = fftSizes.indexOf(tempCapture.settings.fftSize);
        if (fftIndex !== -1) {
            fftSlider.value = fftIndex;
        }
        updateSliderBackground(fftSlider);
        handleValueInput(fftValueInput, fftSlider, fftSizes);
        fftSlider.addEventListener('input', (e) => {
            updateSliderBackground(e.target);
            const val = fftSizes[parseInt(e.target.value)];
            fftValueInput.value = val;
            if (window.audioSpectrum) {
                window.audioSpectrum.updateSettings('fftSize', val);
            }
        });
    }

    if (segSlider) {
        // 设置初始值
        segSlider.value = tempCapture.settings.segments;
        updateSliderBackground(segSlider);
        const segmentsPossible = Array.from({length: 512}, (_, i) => (i + 1) * 8).filter(v => v <= 4096);
        handleValueInput(segValueInput, segSlider, segmentsPossible);
        segSlider.addEventListener('input', (e) => {
            updateSliderBackground(e.target);
            const val = parseInt(e.target.value);
            segValueInput.value = val;
            if (window.audioSpectrum) {
                window.audioSpectrum.updateSettings('segments', val);
            }
        });
    }

    if (smoothSlider) {
        // 设置初始值
        smoothSlider.value = tempCapture.settings.smoothingTimeConstant;
        updateSliderBackground(smoothSlider);
        const smoothPossible = Array.from({length: 101}, (_, i) => (i * 0.01).toFixed(2)).map(Number);
        handleValueInput(smoothValueInput, smoothSlider, smoothPossible, true);
        smoothSlider.addEventListener('input', (e) => {
            updateSliderBackground(e.target);
            const val = parseFloat(e.target.value);
            smoothValueInput.value = val.toFixed(2);
            if (window.audioSpectrum) {
                window.audioSpectrum.updateSettings('smoothingTimeConstant', val);
            }
        });
    }

    // 按钮点击事件
    button.addEventListener('click', async () => {
        if (window.audioSpectrum && window.audioSpectrum.isRunning) {
            window.stopAudioSpectrum();
            button.setAttribute('title', '启动音频频谱');
            button.removeAttribute('data-spectrum-active');
        } else {
            const success = await window.startAudioSpectrum();
            if (success) {
                button.setAttribute('title', '停止音频频谱');
                button.setAttribute('data-spectrum-active', 'true');
                
                // 同步当前设置到新实例
                if (window.audioSpectrum) {
                    const fftIndex = document.getElementById('fft-slider').value;
                    window.audioSpectrum.updateSettings('fftSize', fftSizes[fftIndex]);
                    window.audioSpectrum.updateSettings('segments', document.getElementById('seg-slider').value);
                    window.audioSpectrum.updateSettings('smoothingTimeConstant', document.getElementById('smooth-slider').value);
                }
            }
        }
    });
}

// 页面加载完成后初始化按钮
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpectrumButton);
} else {
    initSpectrumButton();
}
