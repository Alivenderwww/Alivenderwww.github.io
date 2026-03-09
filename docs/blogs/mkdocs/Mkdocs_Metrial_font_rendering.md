---
title: '关于Mkdocs Metrial自定义字体渲染和优化'
date: 2025-12-08 22:14
comment: True
comments: true
---

[wcowin的博客](https://wcowin.work/blog/websitebeauty/mkdocsfont/)讲了自定义字体使用的一种方式，[ronaldln的博客](https://ronaldln.github.io/MyPamphlet-Blog/2023/10/23/mkdocs-material/)讲的更加详细，介绍了多种方法。

但如果你想要用的字体不是Google Fonts上有的，手头只有`.ttf`或者`.otf`格式的文件，或者你想要更好的字体渲染效果，可以参考下面的做法。

## 准备自定义字体

本网站在普通文本中使用的中英文字体均为**方正兰亭圆GBK**，有*纤、细、准、中、中粗、粗、大、特*8个字重，由方正字库提供，模仿了游戏Blue Archive的字体风格；代码块内使用字体为**Maple Mono CN SemiBold**。

方正兰亭圆字体文件和`FZLanT.font.css`一同保存在我自己的阿里云OSS中，使用时仅需调取该css文件即可；Maple Mono CN SemiBold字体文件本体在jsDelivr上，在`mkdocs.yml`中`extra_css`栏引用即可使用。

除此以外，对于日文、韩文字体，方正兰亭圆GBK并不支持，所以调取了[基沃托斯古书馆](https://kivo.wiki)提供的Blueake字体。

综上所述，自定义字体需要准备`css`文件和`字体文件`两部分：

- `css`文件可以放在本地`docs/stylesheets/`目录下，也可以放到服务器上，在`mkdocs.yml`中调取；
- `字体文件`最好放在服务器上，在`css`文件中调取。

> mkdocs.yml

``` css
extra_css:
  - stylesheets/font.css  # 自定义字体CSS
  - stylesheets/extra.css # 自定义CSS
  - https://xxx/fonts/FZLanTY/FZLanTY.font.css
  - https://font.kivo.wiki/Blueaka/Blueaka.css
```

> FZLanTY.font.css

``` css
extra_css:
@import url("./FZLanTYK_Xian/font.css");
@import url("./FZLanTYK_Xi/font.css");
@import url("./FZLanTYK_Zhun/font.css");
@import url("./FZLanTYK_Zhong/font.css");
@import url("./FZLanTYK_ZhongCu/font.css");
@import url("./FZLanTYK_Cu/font.css");
@import url("./FZLanTYK_Da/font.css");
@import url("./FZLanTYK_Te/font.css");
```

## 自定义字体的引用

网站不要设计太多的字体，直接在`extra.css`中修改`root`，指定正文和代码块的字体族即可。

``` css
:root {
  --md-text-font: "FZLanTY", "Blueaka";
  --md-code-font: "Maple Mono CN SemiBold";
}
```

!!! info
    排在后面的字体会作为备选字体使用，当前面的字体无法显示时会使用后面的字体。

!!! warning
    有一个坑点，方正兰亭圆GBK虽然说是支持GBK字符集，但它字符库里的日文和韩文字符是宋体，真尼玛逆天，所以直接这么写会导致日文和韩文字符显示成宋体。因此需要使用FontCreater工具将ttf字体文件中的日文和韩文字体切片删除掉。

    ![FontCreater界面](https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/blogs/PixPin_2026-03-08_15-35-08.png)

    /// figure-caption
    FontCreater界面
    ///

    有人会问为什么不直接用Blueaka，因为Blueaka的字重只有Regular和Bold两种，无法满足不同层级标题和正文的需求。

FZLanTY字体有8个字重，可以根据需要在`extra.css`中指定不同的字重：

``` css
.md-typeset h1{
  font-weight: 800;
}

.md-typeset h2 {
  font-weight: 700;
}

.md-typeset h3 {
  font-weight: 600;
}

.md-typeset li, header{
  font-weight: 400;
}
```

!!! info
    需要在字体引用的css里定义font-weight映射的字体。

## 自定义字体的渲染优化

本文重点其实在这，自定义的字体文件选择什么格式更好，如何渲染带宽更少，都有优化空间。

以方正兰亭圆GBK为例，8个字重的ttf文件加起来共89.8MB，放在网站上显然不合适。并且，ttf格式的字体在网页上的渲染有锯齿，非常难看。

![使用ttf格式的字体渲染](https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/blogs/PixPin_2025-12-04_17-18-52.png)

/// figure-caption
使用ttf格式的字体渲染
///

那么有什么优化方式吗？

### WOFF2格式字体

WOFF2(Web Open Font Format 2)是专门为网页设计的字体格式，具有更好的压缩率和加载速度。将ttf/otf格式的字体转换为woff2格式，可以显著减少文件大小，同时保持较高的渲染质量。

![使用woff2格式的字体渲染](https://alivender-assets.oss-cn-beijing.aliyuncs.com/alivenderwww_github_io/asstes/blogs/PixPin_2025-12-04_17-19-16.png)

/// figure-caption
使用woff2格式的字体渲染
///

将方正兰亭圆GBK的8个字重转换为woff2格式后，文件大小从89.8MB减少到约15MB，加载速度大幅提升，渲染效果也更佳。

即便如此，15MB的字体文件对于网页来说仍然太大了。我们可以使用子集化技术进一步优化。

### 字体子集化

字体子集化是指根据实际使用需求，只保留字体文件中需要的字符，从而大幅减少字体文件的大小。对于只使用部分字符集的网站，子集化可以显著降低字体文件的体积。

但如果删除了想要渲染的字符就完蛋了，因此更好的办法是使用css的`unicode-range`参数，将原始字体文件拆分为数个（甚至几十上百个）woff2子集文件，每个子集文件只包含特定范围的字符，然后在css中使用`@font-face`分别引用这些子集文件，并通过`unicode-range`指定每个子集文件对应的字符范围。

```css hl_lines="7"
@font-face {
  font-family: FZLanTY;
  src: url("./FZLanTYK_Cu.74.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  unicode-range: U+1d2,U+1d4,U+1d6,U+1d8,U+1da,U+1dc,U+1f9,U+251,U+261;
}
```

每个子集字体文件仅几KB到几十KB，网页需要渲染什么字符，就加载字符所在的子集文件，这样大大减少了字体传输总大小。实测仅需710kB的woff2子集文件就能覆盖网站上使用的所有字符。

字体切片推荐使用[font-slice](https://github.com/voderl/font-slice)这个工具，它是根据Google Fonts的切片方式设计的，输入ttf或者otf字体文件自动导出woff2子集和对应的css引用。
