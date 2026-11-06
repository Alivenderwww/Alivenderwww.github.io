---
title: '自回归 AR 模型与平稳性判别'
date: 2026-11-04 16:00
comment: True
comments: true
---

**$\text{ARMA}$ 模型（Auto-Regressive Moving Average，自回归滑动平均模型）**是 20 世纪 70 年代由美国统计学家 Box 和 Jenkins 系统提出的最基本时序参数模型，可细分为 **$\text{AR}$ 模型**、**$\text{MA}$ 模型**和 **$\text{ARMA}$ 模型**三大类。本节从线性回归出发，介绍自回归模型 $\text{AR}(p)$ 的数学结构、延迟算子工具以及核心考点——**平稳性判别**。

---

## 从线性回归到自回归（Auto-Regression）

### 回归（Regression）的起源

“回归”一词最早由英国生物统计学家**高尔顿（Galton）**于 1885 年在论文《身高遗传中的平庸回归》中引入：高个子父母的子女身高虽然偏高，但往往趋向于比父代更接近人群平均身高（即“向平均值靠拢”）。随后**皮尔逊（Pearson）**搜集了上千个家庭的身高数据，用最小二乘法建立了子代身高 $Y$ 对父代身高 $X$ 的一元线性回归方程：

$$
Y = \beta_0 + \beta_1 X + \varepsilon
$$

### 为什么需要“自回归”？

普通线性回归模型 $Y = f(X) + \varepsilon$ 描述的是因变量 $Y$ 与**外部自变量 $X$** 之间的依存关系，但在时间序列场景下存在两大瓶颈：

1. **忽略了序列内部的前后相关性**：例如研究溶质溶解度与温度的关系时，普通回归只刻画了两者之间的依赖，却没有从溶解度序列自身的角度刻画 $x_t$ 与 $x_{t-1}, x_{t-2}$ 的前后依赖。
2. **外部影响因素过多甚至不可观测**：例如股票价格同时受宏观经济、货币制度、技术迭代、市场情绪、突发事件与政策等成百上千个因素影响，根本无法找全所有的外部自变量 $X$ 来建立回归方程。

!!! tip "自回归（Auto-Regression）的核心破局思想"
    避开寻找复杂的外部因变量，直接利用**“随机过程本身的过去观测值 $x_{t-1}, x_{t-2}, \dots$ 与当前值 $x_t$ 之间的内部依赖关系”**来揭示系统的演化规律——用自己过去的值对现在的自己做回归，故名**自回归（Auto-Regression）**。

---

## AR 模型的定义与结构

### 一阶自回归模型 $\text{AR}(1)$

如果序列当前值 $x_t$ 主要与前一时刻的值 $x_{t-1}$ 有关，而与更早以前的行为无直接关系（即**一期记忆 / 最短的记忆**），则可用 $x_{t-1}$ 的线性函数来预测 $x_t$：

$$
x_t = \varphi_0 + \varphi_1 x_{t-1} + \varepsilon_t
$$

称为**一阶自回归模型**，简记为 $\text{AR}(1)$。其中：

- $\varphi_1 \ne 0$ 称为**自回归参数（自回归系数）**；$\varphi_0$ 为常数项（当 $\varphi_0 = 0$ 时称为**中心化 $\text{AR}(1)$ 模型**）；
- $\{\varepsilon_t\} \sim \text{WN}(0, \sigma^2)$ 是零均值、方差为 $\sigma^2$ 的白噪声序列，且假设当前扰动 $\varepsilon_t$ 与过去的历史观测 $x_{t-1}, x_{t-2}, \dots$ 相互独立（不相关）：$\operatorname{Cov}(\varepsilon_t, x_s) = 0\ (s < t)$。
- **未知参数个数**：中心化 $\text{AR}(1)$ 模型包含 **$2$ 个未知参数**——自回归系数 $\varphi_1$ 和白噪声方差 $\sigma^2$（切勿漏掉白噪声方差 $\sigma^2$！）。

<div class="custom-block" markdown>
**$\text{AR}(1)$ 模型的两步分解结构**：
模型 $x_t = \varphi_0 + \varphi_1 x_{t-1} + \varepsilon_t$ 将当前状态 $x_t$ 分解为正交的两部分：

1. **确定性部分（条件数学期望）**：$\hat{x}_t = E(x_t \mid x_{t-1}) = \varphi_0 + \varphi_1 x_{t-1}$，完全由上一时刻历史信息 $x_{t-1}$ 决定；
2. **随机部分（新息 / 扰动）**：$\varepsilon_t = x_t - \hat{x}_t$，完全独立于过去历史 $x_{t-1}$，由当期白噪声 $\varepsilon_t$ 决定。
</div>

| 对比维度 | 普通一元线性回归 $Y_t = \beta_0 + \beta_1 X_t + \varepsilon_t$ | 一阶自回归模型 $x_t = \varphi_0 + \varphi_1 x_{t-1} + \varepsilon_t$ |
| :--- | :--- | :--- |
| **所需数据** | 需要**两组**数据：确定性自变量值 $\{X_t\}$ 与对应的因变量观测值 $\{Y_t\}$ | 只需要**一组**随机变量自身的时间序列观测值 $\{x_t\}$ |
| **依存关系** | 描述一个随机变量对**另一个外部确定性变量**的依存关系 | 描述一个随机变量对**其自身过去滞后值**的动态依存关系 |

/// table-caption
表 2-1：$\text{AR}(1)$ 模型与普通一元线性回归模型的对比
///

---

### $p$ 阶自回归模型 $\text{AR}(p)$

!!! note "定义：$p$ 阶自回归模型 $\text{AR}(p)$"
    具有如下线性结构的模型称为 **$p$ 阶自回归模型**，简记为 $\text{AR}(p)$：

    $$
    x_t = \varphi_0 + \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \cdots + \varphi_p x_{t-p} + \varepsilon_t
    $$

    其中：
    - $\varphi_1, \varphi_2, \dots, \varphi_p$ 为实自回归系数，且最高阶系数 **$\varphi_p \ne 0$**（保证模型阶数为 $p$）；
    - $\{\varepsilon_t\} \sim \text{WN}(0, \sigma^2)$ 为零均值白噪声序列，且对一切 $s < t$ 有 $E(\varepsilon_t x_s) = 0$；
    - 特别地，当 $\varphi_0 = 0$ 时，称为**中心化 $\text{AR}(p)$ 模型**：

    $$
    x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \cdots + \varphi_p x_{t-p} + \varepsilon_t
    $$

---

## 方法性数学工具：延迟算子与差分方程

为了简洁地表示并分析高阶 $\text{AR}(p)$ 模型，需要引入三大数学工具：**延迟算子 $B$**、**差分算子 $\nabla$** 与**齐次线性差分方程**。

### 延迟算子（Backshift Operator）$B$

定义**延迟算子**（也称**后移算子**或**滞后算子**）$B$：将序列中任意元素映射到其自身的滞后一期元素，即

$$
B x_t = x_{t-1}, \qquad B^k x_t = \underbrace{B(B(\cdots B}_{k \text{ 个}} x_t)) = x_{t-k}
$$

- **延迟算子的四条基本运算性质**：
    1. **常数的后移仍为该常数**：$B c = c$（其中 $c$ 为常数）；
    2. **线性分配律**：$(a B^i + b B^j)x_t = a x_{t-i} + b x_{t-j}$；
    3. **指数结合律**：$B^m (B^n x_t) = B^{m+n} x_t = x_{t-m-n}$；
    4. **逆算子为前移算子**：$B^{-1} x_t = x_{t+1}$，满足 $B \cdot B^{-1} = 1$。

- **自回归系数多项式 $\Phi(B)$**：
  利用延迟算子 $B$，中心化 $\text{AR}(p)$ 模型 $x_t - \varphi_1 x_{t-1} - \cdots - \varphi_p x_{t-p} = \varepsilon_t$ 可改写为算子多项式形式：

  $$
  \Phi(B) x_t = \varepsilon_t
  $$

  其中算子多项式：

  $$
  \Phi(B) = 1 - \varphi_1 B - \varphi_2 B^2 - \cdots - \varphi_p B^p
  $$

  称为 $\text{AR}(p)$ 模型的**自回归系数多项式**（或自回归算子多项式）。例如，$\text{AR}(1)$ 模型可简记为 $(1 - \varphi_1 B)x_t = \varepsilon_t$。

---

### 差分算子 $\nabla$

- **一阶差分**：$\nabla x_t = x_t - x_{t-1} = (1 - B)x_t$，即 $\nabla = 1 - B$；
- **$p$ 阶差分**：$\nabla^p x_t = (1 - B)^p x_t = \sum_{j=0}^p (-1)^j \binom{p}{j} x_{t-j}$；
- **$k$ 步（季节）差分**：$\nabla_k x_t = x_t - x_{t-k} = (1 - B^k)x_t$。

---

### 齐次线性差分方程与特征方程

对于 $p$ 阶齐次线性差分方程：

$$
x_t - \varphi_1 x_{t-1} - \varphi_2 x_{t-2} - \cdots - \varphi_p x_{t-p} = 0 \qquad \Longleftrightarrow \qquad \Phi(B)x_t = 0
$$

设其非零特解为幂指数形式 $x_t = \lambda^t\ (\lambda \ne 0)$，代入方程并约去 $\lambda^{t-p}$，得到该差分方程的**特征方程（Characteristic Equation）**：

$$
\lambda^p - \varphi_1 \lambda^{p-1} - \varphi_2 \lambda^{p-2} - \cdots - \varphi_p = 0
$$

该代数方程的 $p$ 个根 $\lambda_1, \lambda_2, \dots, \lambda_p$ 称为 $\text{AR}(p)$ 模型的**特征根（Characteristic Roots）**。

- 当 $\lambda_1, \dots, \lambda_p$ 互不相同时，齐次差分方程的通解为各特征根幂次的线性组合：$x_t = \sum_{i=1}^p c_i \lambda_i^t$。

!!! important "核心定理：特征方程的根 $\lambda_i$ 与自回归系数多项式 $\Phi(B)=0$ 的根 $b_i$ 互为倒数"
    对比以下两个代数方程：

    1. **特征方程**：$\lambda^p - \varphi_1 \lambda^{p-1} - \varphi_2 \lambda^{p-2} - \cdots - \varphi_p = 0$，设其根为 $\lambda_1, \lambda_2, \dots, \lambda_p$；
    2. **自回归系数特征多项式方程**：$\Phi(B) = 1 - \varphi_1 B - \varphi_2 B^2 - \cdots - \varphi_p B^p = 0$，设其根为 $b_1, b_2, \dots, b_p$。

    将 $\lambda = \frac{1}{B}$ 代入特征方程并同乘 $B^p$，立即化为 $\Phi(B) = 0$！因此二者的根严格满足**互为倒数关系**：

    $$
    \lambda_i = \frac{1}{b_i} \qquad (i = 1, 2, \dots, p)
    $$

    进而自回归系数多项式可作因式分解：

    $$
    \Phi(B) = 1 - \varphi_1 B - \cdots - \varphi_p B^p = \prod_{i=1}^p (1 - \lambda_i B)
    $$

---

## AR 模型的平稳性判别（核心必考）

与有限阶 $\text{MA}(q)$ 恒平稳不同，**$\text{AR}(p)$ 模型并不总是平稳的**！先看 $\text{AR}(1)$ 模型 $x_t = \varphi_1 x_{t-1} + \varepsilon_t$ 在不同系数下的表现：

- 当 $\varphi_1 = 0.2$（$|\varphi_1| < 1$）时：历史扰动的影响按 $0.2^k$ 指数衰减，序列围绕均值 $0$ 上下平稳波动；
- 当 $\varphi_1 = 1$（$|\varphi_1| = 1$）时：$x_t = x_{t-1} + \varepsilon_t = \sum_{j=0}^{t-1}\varepsilon_{t-j}$，成为著名的**随机游走（Random Walk）**，方差 $\operatorname{Var}(x_t) = t\sigma^2 \to \infty$ 随时间发散，**非平稳**；
- 当 $\varphi_1 = 1.2$（$|\varphi_1| > 1$）时：历史扰动被 $1.2^k$ 指数放大，序列迅速爆炸发散，**非平稳**。

判断一般 $\text{AR}(p)$ 模型是否平稳，有以下两种等价的判别方法：

### 方法一：特征根判别法

!!! note "定理：$\text{AR}(p)$ 模型的特征根平稳判别准则"
    $\text{AR}(p)$ 模型 $\Phi(B)x_t = \varepsilon_t$ 是宽平稳（且因果平稳）时间序列的充要条件是：

    - **准则 A（按特征根 $\lambda_i$）**：其特征方程 $\lambda^p - \varphi_1 \lambda^{p-1} - \cdots - \varphi_p = 0$ 的 $p$ 个**特征根 $\lambda_1, \dots, \lambda_p$ 全部落在单位圆内**：

    $$
    |\lambda_i| < 1 \qquad (i = 1, 2, \dots, p)
    $$

    - **准则 B（按算子多项式 $\Phi(B)=0$ 的根 $b_i$）**：由于 $\lambda_i = 1/b_i$，等价充要条件是自回归系数多项式 $\Phi(B) = 1 - \varphi_1 B - \cdots - \varphi_p B^p = 0$ 的 $p$ 个**根 $b_1, \dots, b_p$ 全部落在单位圆外**：

    $$
    |b_i| > 1 \qquad (i = 1, 2, \dots, p)
    $$

!!! warning "做题避坑指南：看清你写的是 $\lambda$ 的方程还是 $B$ 的方程！"
    - 如果把模型写成因式分解形式 $(1 - \lambda_1 B)(1 - \lambda_2 B)x_t = \varepsilon_t$（如课堂笔记中的 $(1 - 0.5B)(1 - 0.3B)x_t = \varepsilon_t$），括号里 $B$ 前面的系数 $\lambda_1 = 0.5, \lambda_2 = 0.3$ **直接就是特征根 $\lambda_i$**（只需 $|\lambda_i| < 1$），而令 $1 - \lambda_i B = 0$ 解出的 $b_1 = 2, b_2 = 10/3$ 则是算子多项式 $\Phi(B)=0$ 的根（需 $|b_i| > 1$）。切勿把两者的不等号方向搞反！

---

### 方法二：平稳域判别法（低阶模型秒杀利器）

特征根判别法在需要快速心算判别 $\text{AR}(1)$、$\text{AR}(2)$ 时求根较为繁琐。为此，将“所有特征根模长小于 $1$”直接转化为对自回归系数 $(\varphi_1, \dots, \varphi_p)$ 的不等式约束集合，称为**平稳域（Stationary Region）**：

$$
\mathcal{S}_p = \big\{ (\varphi_1, \varphi_2, \dots, \varphi_p) \in \mathbb{R}^p \ :\ |\lambda_i| < 1,\ i = 1, \dots, p \big\}
$$

=== "1. $\text{AR}(1)$ 模型的平稳域"
    对 $x_t = \varphi_1 x_{t-1} + \varepsilon_t$，特征方程为 $\lambda - \varphi_1 = 0 \implies \lambda = \varphi_1$。
    故 $\text{AR}(1)$ 模型的平稳域为开区间：

    $$
    \boxed{|\varphi_1| < 1 \quad \Longleftrightarrow \quad -1 < \varphi_1 < 1}
    $$

=== "2. $\text{AR}(2)$ 模型的三角形平稳域（高频考点！）"
    对 $x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \varepsilon_t$，特征方程为二次方程：

    $$
    f(\lambda) = \lambda^2 - \varphi_1 \lambda - \varphi_2 = 0
    $$

    其两根 $\lambda_1, \lambda_2$ 均满足 $|\lambda_i| < 1$ 的充要条件（称为 **Schur-Cohn 准则**）是系数 $(\varphi_1, \varphi_2)$ 同时满足以下**三条线性不等式**：

    $$
    \boxed{
    \begin{cases}
    |\varphi_2| < 1 & (\text{即 } -1 < \varphi_2 < 1) \\[4pt]
    \varphi_2 + \varphi_1 < 1 \\[4pt]
    \varphi_2 - \varphi_1 < 1
    \end{cases}
    }
    $$

    在 $(\varphi_1, \varphi_2)$ 平面上，这三条不等式围成一个以 $(-2, -1)$、$(2, -1)$、$(0, 1)$ 为顶点的**倒三角形开区域**！

??? note "点击展开：$\text{AR}(2)$ 三角形平稳域的代数证明"
    设二次特征方程为 $f(\lambda) = \lambda^2 - \varphi_1 \lambda - \varphi_2 = 0$，两根为 $\lambda_1, \lambda_2$，由韦达定理有 $\lambda_1 + \lambda_2 = \varphi_1$，$\lambda_1 \lambda_2 = -\varphi_2$。

    1. **情形 A（两共轭复根，$\Delta = \varphi_1^2 + 4\varphi_2 < 0$）**：
       共轭复根模长的平方为 $|\lambda_{1,2}|^2 = \lambda_1 \lambda_2 = -\varphi_2$。要求 $|\lambda_{1,2}| < 1 \iff -\varphi_2 < 1 \iff \varphi_2 > -1$（且因 $\Delta < 0$ 必有 $\varphi_2 < -\varphi_1^2/4 \le 0 < 1$）。同时由于 $(1 \pm \varphi_1)^2 + 4\varphi_2 > \varphi_1^2 + 4\varphi_2$，此时 $\varphi_2 \pm \varphi_1 < 1$ 自然满足。
    2. **情形 B（两实根，$\Delta = \varphi_1^2 + 4\varphi_2 \ge 0$）**：
       开口向上的抛物线 $f(\lambda) = \lambda^2 - \varphi_1 \lambda - \varphi_2$ 的两个实根均落在 $(-1, 1)$ 区间内的充要条件是：
       - 端点函数值大于零：
         - $f(1) = 1 - \varphi_1 - \varphi_2 > 0 \iff \varphi_2 + \varphi_1 < 1$；
         - $f(-1) = 1 + \varphi_1 - \varphi_2 > 0 \iff \varphi_2 - \varphi_1 < 1$；
       - 对称轴落在 $(-1, 1)$ 内且两根之积 $|\lambda_1 \lambda_2| = |\varphi_2| < 1$。

    综合情形 A 与情形 B，即得充要条件为 $|\varphi_2| < 1$ 且 $\varphi_2 \pm \varphi_1 < 1$。

---

## 课堂实战例题：判断 4 个 AR 模型的平稳性

???+ example "例题（课件 1.40–1.43）：判断下列 4 个 $\text{AR}$ 模型的平稳性"
    请分别使用**特征根判别法**与**平稳域判别法**判断以下 4 个模型是否平稳：

    1. $x_t = 0.8 x_{t-1} + \varepsilon_t$
    2. $x_t = -1.1 x_{t-1} + \varepsilon_t$
    3. $x_t = x_{t-1} - 0.5 x_{t-2} + \varepsilon_t$
    4. $x_t = x_{t-1} + 0.5 x_{t-2} + \varepsilon_t$

    ---

    === "模型 (1)：$x_t = 0.8 x_{t-1} + \varepsilon_t$"
        - **阶数**：$\text{AR}(1)$ 模型，$\varphi_1 = 0.8$。
        - **判别**：$|\varphi_1| = |\lambda_1| = 0.8 < 1$，特征根在单位圆内（系数在平稳域 $(-1, 1)$ 内）。
        - **结论**：==平稳序列==（时序图围绕 $0$ 呈现具有一定惯性的平稳波动）。

    === "模型 (2)：$x_t = -1.1 x_{t-1} + \varepsilon_t$"
        - **阶数**：$\text{AR}(1)$ 模型，$\varphi_1 = -1.1$。
        - **判别**：$|\varphi_1| = |\lambda_1| = |-1.1| = 1.1 > 1$，特征根在单位圆外。
        - **结论**：==非平稳序列==（由于 $\lambda_1 < -1$，时序图呈现正负交替且振幅按指数爆炸发散的振荡）。

    === "模型 (3)：$x_t = x_{t-1} - 0.5 x_{t-2} + \varepsilon_t$"
        - **阶数**：$\text{AR}(2)$ 模型，其中 $\varphi_1 = 1,\ \varphi_2 = -0.5$。
        - **方法一（平稳域判别法，最快）**：
            - $|\varphi_2| = |-0.5| = 0.5 < 1$（满足）
            - $\varphi_2 + \varphi_1 = -0.5 + 1 = 0.5 < 1$（满足）
            - $\varphi_2 - \varphi_1 = -0.5 - 1 = -1.5 < 1$（满足）
        - **方法二（特征根判别法）**：
          特征方程 $\lambda^2 - \lambda + 0.5 = 0$，解得一对共轭复根 $\lambda_{1,2} = \frac{1 \pm i}{2}$，其模长为 $|\lambda_{1,2}| = \sqrt{(0.5)^2 + (0.5)^2} = \frac{\sqrt{2}}{2} \approx 0.707 < 1$，均在单位圆内。
        - **结论**：==平稳序列==（因特征根为共轭复数，其自相关函数与时序图呈现“伪周期”阻尼波动）。

    === "模型 (4)：$x_t = x_{t-1} + 0.5 x_{t-2} + \varepsilon_t$"
        - **阶数**：$\text{AR}(2)$ 模型，其中 $\varphi_1 = 1,\ \varphi_2 = 0.5$。
        - **方法一（平稳域判别法，秒杀）**：
          检查 $\varphi_2 + \varphi_1 = 0.5 + 1 = 1.5 > 1$，**不满足 $\varphi_2 + \varphi_1 < 1$**！
        - **方法二（特征根判别法）**：
          特征方程 $\lambda^2 - \lambda - 0.5 = 0$，解得 $\lambda_{1,2} = \frac{1 \pm \sqrt{3}}{2}$，其中 $\lambda_1 = \frac{1 + \sqrt{3}}{2} \approx 1.366 > 1$ 落在单位圆外。
        - **结论**：==非平稳序列==（时序图单调发散趋向无穷）。

!!! tip "课堂实战小技巧：利用平稳域自我验算展开式"
    老师在课堂上特别提醒：考试中的综合大题（求期望、方差、自相关系数、偏自相关系数）**给出的必然是平稳模型**（因为非平稳模型无法使用 Yule-Walker 方程求平稳统计量）。
    如果题目给的是算子乘积形式（如 $(1 - 0.5B)(1 - 0.3B)x_t = \varepsilon_t$），当你展开移项写出 $\varphi_1, \varphi_2$ 后，**第一时间用 $\varphi_2 \pm \varphi_1 < 1$ 和 $|\varphi_2| < 1$ 验算一下**！如果发现不满足平稳域条件，说明你在展开移项时正负号写错了，可以立刻避免整道大题丢分！

