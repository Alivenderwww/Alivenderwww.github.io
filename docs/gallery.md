---
hide:
  - navigation
  - toc
  - footer
  - feedback
---

<style>
  /* 移除内容区域的所有限制和间距 */
  .md-content, 
  .md-content__inner, 
  .md-main__inner {
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* 隐藏编辑按钮 */
  .md-content__button {
    display: none !important;
  }

  /* 隐藏页面标题 */
  h1 { display: none; }
  
  /* 隐藏可能残留的元数据信息 */
  .md-source-date, 
  .md-source-file {
    display: none !important;
  }

  /* 去除 .md-typeset::before 产生的顶部间距 */
  .md-typeset::before {
    display: none !important;
    content: none !important;
  }
  .md-content__inner {
    padding-top: 0 !important;
    height: 100vh !important; /* 确保容器有足够高度 */
  }

  /* 强制隐藏 Footer */
  .md-footer {
    display: none !important;
  }

  /* 包装器：负责 Sticky 定位 */
  #gallery-wrapper {
    position: sticky;
    /* 使用 CSS 变量获取 Header 高度，默认为 48px */
    top: var(--md-header-height, 48px);
    width: 100%;
    /* 高度填满剩余屏幕 */
    height: calc(100vh - var(--md-header-height, 48px));
    z-index: 1;
  }

  /* Iframe 填满包装器 */
  iframe#gallery-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  /* 滚动遮罩层：绝对定位覆盖在包装器上 */
  #scroll-blocker {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10; /* 在 iframe 之上 */
    background: transparent;
    /* background: rgba(255, 0, 0, 0.1); 调试用 */
  }
</style>

<div id="gallery-wrapper">
  <div id="scroll-blocker"></div>
  <iframe id="gallery-frame" src="https://dpp-alivender.afilmory.art/"></iframe>
</div>

<script>
  // 简单的滚动交互逻辑
  // 当页面处于顶部时，显示遮罩层，让用户滚动主页面（收起 Tabs）
  // 当页面向下滚动后，隐藏遮罩层，让用户可以操作 iframe
  
  var blocker = document.getElementById('scroll-blocker');
  var threshold = 20; // 滚动阈值，稍微滚动一点就穿透

  function updateBlocker() {
    if (window.scrollY > threshold) {
      blocker.style.pointerEvents = 'none';
    } else {
      blocker.style.pointerEvents = 'auto';
    }
  }

  // 监听滚动事件
  window.addEventListener('scroll', updateBlocker);
  
  // 初始化检查
  updateBlocker();
</script>
