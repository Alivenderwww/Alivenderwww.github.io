---
title: '如何实现Giscus评论区的自动跟随主题配置'
comment: True
comments: true
---

Giscus评论区是通过iframe嵌入的GitHub Discussions评论系统，iframe内的内容样式是独立于主页面的，一般方法获取不到iframe内的DOM元素，因此无法直接通过主页面的CSS来修改Giscus评论区的样式。

想要实现控制iframe内的样式，基本只能通过`postMessage`方法，向iframe发送消息来控制其样式。Giscus教程里提供的切换主题功能也是使用了`postMessage`来切换其应用的css样式。

[关于如何向iframe传递消息的讨论](https://stackoverflow.com/questions/9153445/how-to-communicate-between-iframe-and-the-parent-site)

但我的博客有蓝色/紫色两种颜色主题，万圣节当天还有一套主题，再加上黑白两种模式，总共六种主题，我要是写六份单独的css文件就太麻烦了。其实可以实现将Giscus的主题css设置为颜色变量，再通过`postMessage`传递颜色变量，实现任意配色。

还有一点，Giscus的字体和我的博客字体不一致，要是想统一一下字体，还需要在css里设置字体，注意导入字体的import语句要在css文件的最前面。

Giscus还可以更改加载时的loading图标，我给换成gif了：

![爱丽丝可爱捏](https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/blogs/PixPin_2025-12-11_21-43-56.png)

/// figure-caption
爱丽丝可爱捏
///


```javascript
// 更新Giscus主题
async function updateGiscusTheme() {
    if (!isGiscusReady) return;
    // Get computed styles to retrieve current theme variables
    const computedStyle = getComputedStyle(document.body);
    
    // List of variables we need to pass to Giscus
    const variables = [
        '--md-primary-top-color',
        '--md-primary-fg-color',
        '--md-accent-fg-color',
        '--md-primary-fg-color--light',
        '--md-primary-fg-color--dark',
        '--md-primary-blue',
        '--md-primary-blue--light',
        '--md-primary-blue--dark',
        '--md-primary-text',
        '--md-primary-text-light',
        '--md-primary-text-dark',
        '--md-primary-text-reverse',
        '--md-primary-text-rgb',
        '--md-primary-text--color',
        '--md-code-bg-color',
        '--md-code-hl-color',
        '--md-code-hl-color--light',
        '--md-code-hl-function-color',
        '--md-code-hl-constant-color',
        '--md-code-hl-keyword-color',
        '--md-code-hl-string-color',
        '--md-typeset-a-color'
    ];
    let cssVars = '';
    variables.forEach(v => {
        const value = computedStyle.getPropertyValue(v).trim();
        if (value) {
            cssVars += `${v}: ${value};\n`;
        }
    });
    let isSlate = false;
    if (window.__md_get) {
        const palette = window.__md_get("__palette");
        if (palette && palette.color && palette.color.scheme) {
            isSlate = palette.color.scheme === "slate";
        }
    }
    
    const cssUrl = isSlate 
        ? "/stylesheets/comments_dark.css"
        : "/stylesheets/comments_light.css";
        
    try {
        let cssText;
        if (giscusCssCache[cssUrl]) {
            cssText = giscusCssCache[cssUrl];
        } else {
            const response = await fetch(cssUrl);
            cssText = await response.text();
            giscusCssCache[cssUrl] = cssText;
        }
        
        // 将变量定义放在最后，以确保 @import 语句（如果在 cssText 开头）保持在文件最前面
        const injectedCss = `${cssText}\n:root {\n${cssVars}\n}`;
        
        // Use Data URI instead of Blob URL because Giscus (cross-origin) cannot read Blob URL
        const base64Css = btoa(unescape(encodeURIComponent(injectedCss)));
        const dataUrl = `data:text/css;base64,${base64Css}`;
        
        const iframe = document.querySelector('iframe.giscus-frame');
        if (iframe) {
            iframe.contentWindow.postMessage(
                { giscus: { setConfig: { theme: dataUrl } } },
                'https://giscus.app'
            );
        }
    } catch (e) {
        console.error('Failed to update Giscus theme:', e);
    }
}
```

```css
@import url("https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/fonts/FZLanTY/FZLanTY.font.css");

@font-face {
    font-family: 'Ubuntu Mono derivative Powerline';
    font-style: normal;
    font-weight: 400;
    src: url("https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/fonts/Ubuntu Mono derivative Powerline.ttf");
}

@font-face {
    font-family: 'Ubuntu Mono derivative Powerline';
    font-style: italic;
    font-weight: 400;
    src: url("https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/fonts/Ubuntu Mono derivative Powerline Italic.ttf");
}

@font-face {
    font-family: 'Ubuntu Mono derivative Powerline';
    font-style: normal;
    font-weight: 700;
    src: url("https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/fonts/Ubuntu Mono derivative Powerline Bold.ttf");
}

@font-face {
    font-family: 'Ubuntu Mono derivative Powerline';
    font-style: italic;
    font-weight: 700;
    src: url("https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/fonts/Ubuntu Mono derivative Powerline Bold Italic.ttf");
}

/*! MIT License
 * Copyright (c) 2018 GitHub Inc.
 * https://github.com/primer/primitives/blob/main/LICENSE
 */
main {
    --color-prettylights-syntax-comment: var(--md-primary-text-dark);
    --color-prettylights-syntax-constant: var(--md-primary-blue);
    --color-prettylights-syntax-entity: var(--md-primary-blue);
    --color-prettylights-syntax-storage-modifier-import: var(--md-primary-text);
    --color-prettylights-syntax-entity-tag: var(--md-primary-blue);
    --color-prettylights-syntax-keyword: var(--md-accent-fg-color);
    --color-prettylights-syntax-string: var(--md-primary-blue--dark);
    --color-prettylights-syntax-variable: var(--md-accent-fg-color);
    --color-prettylights-syntax-brackethighlighter-unmatched: var(--md-accent-fg-color);
    --color-prettylights-syntax-invalid-illegal-text: var(--md-primary-fg-color--light);
    --color-prettylights-syntax-invalid-illegal-bg: var(--md-accent-fg-color);
    --color-prettylights-syntax-carriage-return-text: var(--md-primary-fg-color--light);
    --color-prettylights-syntax-carriage-return-bg: var(--md-accent-fg-color);
    --color-prettylights-syntax-string-regexp: var(--md-primary-blue);
    --color-prettylights-syntax-markup-list: var(--md-primary-text);
    --color-prettylights-syntax-markup-heading: var(--md-primary-blue);
    --color-prettylights-syntax-markup-italic: var(--md-primary-text--color);
    --color-prettylights-syntax-markup-bold: var(--md-primary-text--color);
    --color-prettylights-syntax-markup-deleted-text: var(--md-accent-fg-color);
    --color-prettylights-syntax-markup-deleted-bg: color-mix(in srgb, var(--md-accent-fg-color), transparent 85%);
    --color-prettylights-syntax-markup-inserted-text: var(--md-primary-blue);
    --color-prettylights-syntax-markup-inserted-bg: color-mix(in srgb, var(--md-primary-blue), transparent 85%);
    --color-prettylights-syntax-markup-changed-text: var(--md-accent-fg-color);
    --color-prettylights-syntax-markup-changed-bg: color-mix(in srgb, var(--md-accent-fg-color), transparent 75%);
    --color-prettylights-syntax-markup-ignored-text: var(--md-primary-text-light);
    --color-prettylights-syntax-markup-ignored-bg: var(--md-primary-blue);
    --color-prettylights-syntax-meta-diff-range: var(--md-primary-blue);
    --color-prettylights-syntax-brackethighlighter-angle: var(--md-primary-text-dark);
    --color-prettylights-syntax-sublimelinter-gutter-mark: var(--md-primary-text-dark);
    --color-prettylights-syntax-constant-other-reference-link: var(--md-primary-blue--dark);
    --color-btn-text: var(--md-primary-text--color);
    --color-btn-bg: var(--md-primary-fg-color--light);
    --color-btn-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-btn-shadow: 0 1px 0 #1b1f240a;
    --color-btn-inset-shadow: inset 0 1px 0 #ffffff40;
    --color-btn-hover-bg: var(--md-primary-fg-color--light);
    --color-btn-hover-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-btn-active-bg: var(--md-primary-fg-color--light);
    --color-btn-active-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-btn-selected-bg: var(--md-primary-fg-color--light);
    --color-btn-primary-text: var(--md-primary-blue--light);
    --color-btn-primary-bg: var(--md-primary-blue--dark);
    --color-btn-primary-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-btn-primary-shadow: 0 1px 0 #1b1f241a;
    --color-btn-primary-inset-shadow: inset 0 1px 0 #ffffff08;
    --color-btn-primary-hover-bg: var(--md-primary-blue--dark);
    --color-btn-primary-hover-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-btn-primary-selected-bg: var(--md-primary-blue);
    --color-btn-primary-selected-shadow: inset 0 1px 0 #00215533;
    --color-btn-primary-disabled-text: color-mix(in srgb, var(--md-primary-blue--light), transparent 20%);
    --color-btn-primary-disabled-bg: color-mix(in srgb, var(--md-primary-blue), transparent 50%);
    --color-btn-primary-disabled-border: color-mix(in srgb, var(--md-primary-text), transparent 85%);
    --color-action-list-item-default-hover-bg: color-mix(in srgb, var(--md-primary-text-light), transparent 70%);
    --color-segmented-control-bg: var(--md-primary-fg-color--light);
    --color-segmented-control-button-bg: var(--md-primary-blue--light);
    --color-segmented-control-button-selected-border: var(--md-primary-text-dark);
    --color-fg-default: var(--md-primary-text--color);
    --color-fg-muted: var(--md-primary-text-dark);
    --color-fg-subtle: var(--md-primary-text-dark);
    --color-canvas-default: var(--md-primary-blue--light);
    --color-canvas-overlay: var(--md-primary-blue--light);
    --color-canvas-inset: var(--md-primary-fg-color--light);
    --color-canvas-subtle: var(--md-primary-fg-color--light);
    --color-border-default: var(--md-primary-text-light);
    --color-border-muted: var(--md-primary-text-light);
    --color-neutral-muted: color-mix(in srgb, var(--md-primary-text-light), transparent 80%);
    --color-accent-fg: var(--md-primary-blue--dark);
    --color-accent-emphasis: var(--md-primary-blue--dark);
    --color-accent-muted: color-mix(in srgb, var(--md-primary-blue), transparent 60%);
    --color-accent-subtle: color-mix(in srgb, var(--md-primary-blue), transparent 85%);
    --color-success-fg: var(--md-primary-blue--dark);
    --color-attention-fg: var(--md-accent-fg-color);
    --color-attention-muted: color-mix(in srgb, var(--md-accent-fg-color), transparent 60%);
    --color-attention-subtle: color-mix(in srgb, var(--md-accent-fg-color), transparent 85%);
    --color-danger-fg: var(--md-accent-fg-color);
    --color-danger-muted: color-mix(in srgb, var(--md-accent-fg-color), transparent 60%);
    --color-danger-subtle: color-mix(in srgb, var(--md-accent-fg-color), transparent 85%);
    --color-primer-shadow-inset: inset 0 1px 0 #d0d7de33;
    --color-scale-gray-1: var(--md-primary-fg-color--light);
    --color-scale-blue-1: var(--md-primary-blue);

    /*! Extensions from @primer/css/alerts/flash.scss */
    --color-social-reaction-bg-hover: var(--color-scale-gray-1);
    --color-social-reaction-bg-reacted-hover: var(--color-scale-blue-1)
}

main .pagination-loader-container {
    background-image: url(https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/asstes/icons/loading.gif)
}

main .gsc-loading-image {
    background-image: url(https://▇▇▇▇▇▇▇▇▇▇▇▇/alivenderwww_github_io/asstes/icons/loading.gif)
}

:host,
html {
    --font-family-sans: "FZLanTY";
    --font-family-monospace: "Ubuntu Mono derivative Powerline";
    --font-family-default: var(--font-family-sans);
}
```

最终效果：

![Giscus四色主题切换效果](https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/blogs/PixPin_2025-12-11_21-36-36.png)

/// figure-caption
Giscus四色主题切换效果
///

我之前看到一个用hexo搭建的一个博客有一个自定义配色系统，可以无极调节博客的主题颜色，用的也是Giscus评论区，它的颜色也能跟随变化，但是忘了链接是啥了（