---
title: 'AR 模型的统计特性（Green 函数、ACF 与 PACF）'
date: 2026-11-04 16:00
comment: True
comments: true
---

在确认 $\text{AR}(p)$ 模型满足平稳性条件（特征根 $|\lambda_i| < 1$）的前提下，本节系统推导平稳 $\text{AR}(p)$ 序列的五大统计特性：**均值**、**Green 函数与传递形式**、**方差**、**自协方差与自相关系数（ACF）**以及**偏自相关系数（PACF）**。

---

## 均值与中心化变换

### 平稳 $\text{AR}(p)$ 模型的均值

设非中心化平稳 $\text{AR}(p)$ 模型为：

$$
x_t = \varphi_0 + \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \cdots + \varphi_p x_{t-p} + \varepsilon_t, \qquad \{\varepsilon_t\} \sim \text{WN}(0, \sigma^2)
$$

对等式两边同时取数学期望 $E(\cdot)$。由于序列平稳，对一切时刻有 $E(x_t) = E(x_{t-1}) = \cdots = E(x_{t-p}) = \mu$，且 $E(\varepsilon_t) = 0$，故：

$$
\mu = \varphi_0 + \varphi_1 \mu + \varphi_2 \mu + \cdots + \varphi_p \mu + 0
$$

由于模型平稳，$1 - \sum_{i=1}^p \varphi_i = \Phi(1) = \prod_{i=1}^p (1 - \lambda_i) \ne 0$，移项解得**平稳 $\text{AR}(p)$ 序列的均值公式**：

$$
\boxed{\mu = E(x_t) = \frac{\varphi_0}{1 - \varphi_1 - \varphi_2 - \cdots - \varphi_p}}
$$

- **重要特例**：当 $\varphi_0 = 0$（**中心化平稳 $\text{AR}(p)$ 模型**）时，必有 **$\mu = E(x_t) \equiv 0$**。

### $\text{AR}(p)$ 序列的中心化变换

若 $\varphi_0 \ne 0$，令中心化序列 $y_t = x_t - \mu$，将 $x_{t-i} = y_{t-i} + \mu$ 代入原方程，常数项 $\varphi_0$ 与 $(1 - \sum \varphi_i)\mu$ 恰好完全抵消，化为标准中心化 $\text{AR}(p)$ 模型：

$$
y_t = \varphi_1 y_{t-1} + \varphi_2 y_{t-2} + \cdots + \varphi_p y_{t-p} + \varepsilon_t
$$

因此，以下研究方差、自协方差、ACF 与 PACF 时，**只需针对中心化 $\text{AR}(p)$ 模型（$\mu = 0$）进行推导**。

---

## 传递形式与 Green 函数（格林函数）

### 从 $\text{AR}(1)$ 认识方差与传递形式

对中心化平稳 $\text{AR}(1)$ 模型 $x_t = \varphi_1 x_{t-1} + \varepsilon_t\ (|\varphi_1| < 1)$：

- **直接求方差**：由于 $\varepsilon_t$ 与 $x_{t-1}$ 独立，两边直接取方差 $D(x_t) = \varphi_1^2 D(x_{t-1}) + D(\varepsilon_t)$，结合平稳性 $D(x_t) = D(x_{t-1}) = \gamma_0$，立刻解得：

  $$
  \gamma_0 = \operatorname{Var}(x_t) = \frac{\sigma^2}{1 - \varphi_1^2}
  $$

  *(隐含条件：由方差正定性 $\gamma_0 > 0$ 也直接要求 $1 - \varphi_1^2 > 0 \iff |\varphi_1| < 1$！)*

- **算子泰勒级数展开（传递形式）**：
  利用延迟算子将 $\text{AR}(1)$ 写为 $(1 - \varphi_1 B)x_t = \varepsilon_t$。当 $|\varphi_1| < 1$ 时，将 $(1 - \varphi_1 B)^{-1}$ 按无穷等比级数（泰勒级数）展开：

  $$
  x_t = \frac{1}{1 - \varphi_1 B}\varepsilon_t = \left(\sum_{j=0}^\infty \varphi_1^j B^j\right)\varepsilon_t = \sum_{j=0}^\infty \varphi_1^j \varepsilon_{t-j} = \varepsilon_t + \varphi_1 \varepsilon_{t-1} + \varphi_1^2 \varepsilon_{t-2} + \cdots
  $$

  这一变换把原本**前后相关的平稳序列 $\{x_t\}$** 表示成了**互不相关的纯随机白噪声序列 $\{\varepsilon_{t-j}\}$ 的无穷线性组合**，称为模型的**传递形式（Transfer Form / Wold 表示）**。

---

### Green 函数 $G_j$ 的定义与物理意义

!!! note "定义：$\text{AR}(p)$ 模型的传递形式与 Green 函数"
    当一个相关的平稳时间序列 $\{x_t\}$ 可以用不相关的白噪声序列 $\{\varepsilon_t\}$ 的现在值和过去值的无穷线性组合表示时，其权重系数序列 $\{G_j\}$ 定义为 **Green 函数（格林函数）**：

    $$
    x_t = \Phi^{-1}(B)\varepsilon_t = \sum_{j=0}^\infty G_j \varepsilon_{t-j} = G_0 \varepsilon_t + G_1 \varepsilon_{t-1} + G_2 \varepsilon_{t-2} + \cdots \qquad (G_0 \equiv 1)
    $$

<div class="custom-block" markdown>
**Green 函数 $G_j$ 的物理与系统意义**：

- **脉冲响应权重**：$G_j$ 描述了 **$j$ 个时间单位以前的单位随机扰动 $\varepsilon_{t-j}$** 传递到当前时刻，对系统当前行为 $x_t$ 造成的残留影响大小；
- **系统记忆性强弱**：$|G_j|$ 的大小直接反映了系统记忆性的强弱；
- **平稳系统的渐近遗忘性**：若 $\text{AR}(p)$ 模型平稳（$|\lambda_i| < 1$），则当 $j \to \infty$ 时必有 **$|G_j| \to 0$（呈指数衰减）**，即越久远的历史干扰对现在的影响越微弱，系统具有短期记忆性。
</div>

---

### Green 函数的两种求解方法

=== "方法一：待定系数递推公式（最常用）"
    由 $\Phi(B)x_t = \varepsilon_t$ 及 $x_t = \sum_{j=0}^\infty G_j B^j \varepsilon_t$，意味着两个算子多项式相乘恒等于 $1$：

    $$
    \big(1 - \varphi_1 B - \varphi_2 B^2 - \cdots - \varphi_p B^p\big)\big(G_0 + G_1 B + G_2 B^2 + \cdots\big) \equiv 1
    $$

    展开左边并按 $B^j$ 的同次幂合并同类项，比较等式两边 $B^j$ 的系数，即得 **Green 函数递推公式**：

    $$
    \boxed{
    \begin{cases}
    G_0 = 1, \\[4pt]
    G_j = \displaystyle\sum_{i=1}^{\min(j, p)} \varphi_i G_{j-i} = \varphi_1 G_{j-1} + \varphi_2 G_{j-2} + \cdots + \varphi_p G_{j-p}, & j \ge 1
    \end{cases}
    }
    $$

    *(约定当下标小于 $0$ 时 $G_k = 0$。)*

=== "方法二：特征根部分分式展开通式"
    设特征方程 $\lambda^p - \varphi_1 \lambda^{p-1} - \cdots - \varphi_p = 0$ 有 $p$ 个互异非零特征根 $\lambda_1, \lambda_2, \dots, \lambda_p$，将 $\Phi^{-1}(B) = \frac{1}{\prod_{i=1}^p (1 - \lambda_i B)}$ 作部分分式展开可得通项公式：

    $$
    G_j = \sum_{i=1}^p c_i \lambda_i^j, \qquad \text{其中 } c_i = \frac{\lambda_i^{p-1}}{\prod_{\substack{k=1 \\ k \ne i}}^p (\lambda_i - \lambda_k)}
    $$

    - 对 **$\text{AR}(1)$ 模型**：$G_j = \varphi_1^j\ (j = 0, 1, 2, \dots)$；
    - 对 **$\text{AR}(p)$ 模型**：由于平稳时 $|\lambda_i| < 1$，故 $G_j$ 是各特征根幂次的线性组合，随 $j$ 增大呈**指数衰减**。

???+ example "课堂练习（课件 2.20）：求 $\text{AR}(2)$ 模型 $x_t = x_{t-1} - 0.5 x_{t-2} + \varepsilon_t$ 的 Green 函数"
    **解**：这里 $\varphi_1 = 1,\ \varphi_2 = -0.5$。
    - **若求前若干项（递推法）**：
        - $G_0 = 1$
        - $G_1 = \varphi_1 G_0 = 1 \times 1 = 1$
        - $G_2 = \varphi_1 G_1 + \varphi_2 G_0 = 1 \times 1 + (-0.5) \times 1 = 0.5$
        - $G_3 = \varphi_1 G_2 + \varphi_2 G_1 = 1 \times 0.5 - 0.5 \times 1 = 0$
        - $G_4 = \varphi_1 G_3 + \varphi_2 G_2 = 0 - 0.5 \times 0.5 = -0.25$
    - **若求通项公式（特征根法）**：
      特征方程 $\lambda^2 - \lambda + 0.5 = 0$ 的两根为 $\lambda_{1,2} = \frac{1 \pm i}{2} = \left(\frac{\sqrt{2}}{2}\right) e^{\pm i \frac{\pi}{4}}$。
      代入二阶通项公式 $G_j = \frac{\lambda_1^{j+1} - \lambda_2^{j+1}}{\lambda_1 - \lambda_2}$，利用欧拉公式化为实三角函数形式：

      $$
      G_j = \left(\frac{\sqrt{2}}{2}\right)^j \cdot \frac{\sin\left(\frac{j+1}{4}\pi\right)}{\sin\left(\frac{\pi}{4}\right)} = 2^{-\frac{j-1}{2}} \sin\left(\frac{j+1}{4}\pi\right), \qquad j = 0, 1, 2, \dots
      $$

### 利用传递形式求方差

由于传递形式 $x_t = \sum_{j=0}^\infty G_j \varepsilon_{t-j}$ 中各项白噪声 $\varepsilon_{t-j}$ 两两不相关，直接逐项求方差可得：

$$
\gamma_0 = \operatorname{Var}(x_t) = \operatorname{Var}\left(\sum_{j=0}^\infty G_j \varepsilon_{t-j}\right) = \sum_{j=0}^\infty G_j^2 \operatorname{Var}(\varepsilon_{t-j}) = \sigma^2 \sum_{j=0}^\infty G_j^2
$$

*(注：对于 $\text{AR}(1)$，$G_j = \varphi_1^j$，故 $\gamma_0 = \sigma^2 \sum_{j=0}^\infty \varphi_1^{2j} = \frac{\sigma^2}{1-\varphi_1^2}$；但对于 $\text{AR}(2)$ 及更高阶模型，无穷级数 $\sum G_j^2$ 求和较繁琐，课堂上老师更推荐使用下面的**自协方差递推方程联立法**求方差 $\gamma_0$！)*

---

## 自协方差函数与自相关系数（ACF）

### 自协方差递推算式（Yule-Walker 方程）

!!! danger "课堂高频易错警示：求 $\text{AR}(2)$ 方差千万不能对等式右边直接按独立和展开！"
    对 $x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \varepsilon_t$，**绝对不能**写出 $\operatorname{Var}(x_t) = \varphi_1^2 \operatorname{Var}(x_{t-1}) + \varphi_2^2 \operatorname{Var}(x_{t-2}) + \sigma^2$！
    因为 $x_{t-1}$ 与 $x_{t-2}$ 之间**存在强自协方差 $\gamma_1 \ne 0$**，直接拆开会漏掉交叉协方差项 $2\varphi_1\varphi_2\operatorname{Cov}(x_{t-1}, x_{t-2})$！
    正确做法是：**将方差 $\gamma_0$ 与自协方差 $\gamma_1, \dots, \gamma_p$ 打包联立求解**！

在中心化平稳 $\text{AR}(p)$ 方程 $x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \cdots + \varphi_p x_{t-p} + \varepsilon_t$ 两边**同时乘以 $x_{t-k}\ (k \ge 0)$ 并取数学期望 $E(\cdot)$**：

$$
\underbrace{E(x_t x_{t-k})}_{\gamma_k} = \varphi_1 \underbrace{E(x_{t-1} x_{t-k})}_{\gamma_{k-1}} + \varphi_2 \underbrace{E(x_{t-2} x_{t-k})}_{\gamma_{k-2}} + \cdots + \varphi_p \underbrace{E(x_{t-p} x_{t-k})}_{\gamma_{k-p}} + E(\varepsilon_t x_{t-k})
$$

注意到当期的白噪声 $\varepsilon_t$ 与过去的历史值 $x_{t-k}\ (k \ge 1)$ 不相关，且当 $k = 0$ 时 $E(\varepsilon_t x_t) = E\big[\varepsilon_t(\varphi_1 x_{t-1} + \cdots + \varepsilon_t)\big] = E(\varepsilon_t^2) = \sigma^2$，即：

$$
E(\varepsilon_t x_{t-k}) = \begin{cases} \sigma^2, & k = 0, \\[4pt] 0, & k \ge 1. \end{cases}
$$

由此得到极为重要的 **$\text{AR}(p)$ 自协方差函数递推方程组**：

$$
\boxed{
\begin{cases}
\gamma_0 = \varphi_1 \gamma_1 + \varphi_2 \gamma_2 + \cdots + \varphi_p \gamma_p + \sigma^2, & (k = 0) \\[6pt]
\gamma_k = \varphi_1 \gamma_{k-1} + \varphi_2 \gamma_{k-2} + \cdots + \varphi_p \gamma_{k-p}, & (k \ge 1)
\end{cases}
}
$$

!!! tip "课堂记忆口诀与联立求解步骤"
    - **下标守恒口诀**：递推式 $\gamma_k = \sum_{i=1}^p \varphi_i \gamma_{k-i}$ 右边每一项中，$\varphi_i$ 的下标 $i$ 与 $\gamma_{k-i}$ 的下标 $k-i$ **相加恰好等于左边的 $k$**！再配合偶函数对称性 **$\gamma_{-m} = \gamma_m$**，即可瞬间写出前 $p+1$ 个方程。
    - **联立求解**：取 $k = 0, 1, 2, \dots, p$ 共 **$p + 1$ 个线性方程**，恰好包含 $\gamma_0, \gamma_1, \dots, \gamma_p$ 共 $p+1$ 个未知数，联立即可一次性解出方差 $\gamma_0$ 和前 $p$ 阶自协方差！更高阶的 $\gamma_k\ (k > p)$ 直接按递推式往后递推即可。

---

### 自相关系数（ACF）递推方程与典型公式

将自协方差递推式 $k \ge 1$ 两边同时除以方差 $\gamma_0$（注意 **$\rho_0 \equiv 1$**，且 $\rho_{-m} = \rho_m$），立即得到 **$\text{AR}(p)$ 自相关系数的 Yule-Walker 递推方程**：

$$
\boxed{\rho_k = \varphi_1 \rho_{k-1} + \varphi_2 \rho_{k-2} + \cdots + \varphi_p \rho_{k-p} \qquad (k \ge 1)}
$$

*(若用 Green 函数表示，则有 $\gamma_k = \sigma^2 \sum_{j=0}^\infty G_j G_{j+k}$，$\rho_k = \frac{\sum_{j=0}^\infty G_j G_{j+k}}{\sum_{j=0}^\infty G_j^2}$。)*

=== "1. $\text{AR}(1)$ 模型的 $\gamma_k$ 与 $\rho_k$"
    对 $x_t = \varphi_1 x_{t-1} + \varepsilon_t\ (|\varphi_1| < 1)$：
    - **自相关系数**：由 $\rho_k = \varphi_1 \rho_{k-1}$ 及 $\rho_0 = 1$，得

      $$
      \rho_k = \varphi_1^k \qquad (k \ge 0)
      $$

    - **方差与自协方差**：

      $$
      \gamma_0 = \frac{\sigma^2}{1 - \varphi_1^2}, \qquad \gamma_k = \gamma_0 \rho_k = \frac{\varphi_1^k}{1 - \varphi_1^2}\sigma^2 \qquad (k \ge 0)
      $$

=== "2. $\text{AR}(2)$ 模型的 $\gamma_k$ 与 $\rho_k$（必背高频公式！）"
    对 $x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \varepsilon_t$：
    - **先求 $\rho_1, \rho_2$**：在 $\rho_k = \varphi_1 \rho_{k-1} + \varphi_2 \rho_{k-2}$ 中令 $k = 1, 2$（利用 $\rho_0 = 1,\ \rho_{-1} = \rho_1$）：

      $$
      \begin{cases}
      \rho_1 = \varphi_1 \rho_0 + \varphi_2 \rho_{-1} = \varphi_1 + \varphi_2 \rho_1 \\[4pt]
      \rho_2 = \varphi_1 \rho_1 + \varphi_2 \rho_0 = \varphi_1 \rho_1 + \varphi_2
      \end{cases}
      \implies
      \boxed{
      \rho_1 = \frac{\varphi_1}{1 - \varphi_2}, \qquad
      \rho_2 = \varphi_2 + \frac{\varphi_1^2}{1 - \varphi_2} = \frac{\varphi_1^2 + \varphi_2 - \varphi_2^2}{1 - \varphi_2}
      }
      $$

    - **再求方差 $\gamma_0$**（联立 $\gamma_0 = \varphi_1 \gamma_1 + \varphi_2 \gamma_2 + \sigma^2 = \gamma_0(\varphi_1 \rho_1 + \varphi_2 \rho_2) + \sigma^2$）：

      $$
      \boxed{
      \gamma_0 = \frac{\sigma^2}{1 - \varphi_1 \rho_1 - \varphi_2 \rho_2} = \left(\frac{1 - \varphi_2}{1 + \varphi_2}\right) \frac{\sigma^2}{(1 - \varphi_2)^2 - \varphi_1^2}
      }
      $$

---

### 平稳 $\text{AR}(p)$ 自相关系数的三大性质与四种衰减形态

由于 $\rho_k - \varphi_1 \rho_{k-1} - \cdots - \varphi_p \rho_{k-p} = 0\ (k \ge 1)$ 是与原模型具有相同特征方程的齐次线性差分方程，其通解为特征根幂次的线性组合 $\rho_k = \sum_{i=1}^p d_i \lambda_i^k\ (|\lambda_i| < 1)$。由此决定平稳 $\text{AR}(p)$ 模型的自相关系数具有**三大核心性质**：

1. **短期相关性**：当 $k \to \infty$ 时 $\rho_k \to 0$，只有有限滞后阶数以内的相关性较强；
2. **呈指数衰减**：$|\rho_k|$ 随滞后阶数 $k$ 的增大按指数速度收敛于 $0$；
3. **==拖尾性（Tailing Off）==**：$\rho_k$ 随 $k$ 增大逐渐衰减趋于 $0$，但**绝不会在某一有限阶 $q$ 之后恒等于 $0$**（这与下一节 $\text{MA}(q)$ 模型自相关系数的“截尾性”形成鲜明对比）。

根据特征根 $\lambda_i$ 的类型（正实根、负实根、共轭复根、混合根），$\text{AR}$ 模型的自相关图（ACF）呈现出**四种典型衰减形态**：

| 衰减形态 | 特征根 $\lambda_i$ 类型 | 课件典型模型示例 | ACF 图形表现 |
| :--- | :--- | :--- | :--- |
| **① 单调指数衰减** | 正实根（$0 < \lambda_i < 1$） | $x_t = 0.8 x_{t-1} + \varepsilon_t$ | $\rho_k = 0.8^k > 0$，全在正半轴按指数单调平滑递减至 $0$ |
| **② 正负相间衰减** | 负实根（$-1 < \lambda_i < 0$） | $x_t = -0.8 x_{t-1} + \varepsilon_t$ | $\rho_k = (-0.8)^k$，正负交替震荡且包络线按指数收敛至 $0$ |
| **③ “伪周期”阻尼衰减** | 共轭复根（$\lambda_{1,2} = r e^{\pm i\omega},\ r < 1$） | $x_t = x_{t-1} - 0.5 x_{t-2} + \varepsilon_t$ | $\rho_k$ 呈现阻尼正弦波式的**“伪周期”正负波浪形衰减** |
| **④ 不规则衰减** | 高阶实根与复根混合 | $x_t = 0.3 x_{t-1} + 0.4 x_{t-2} - 0.5 x_{t-3} + 0.2 x_{t-4} + \varepsilon_t$ | 多种衰减模态叠加，呈现不规则震荡收敛 |

/// table-caption
表 2-2：平稳 AR 模型自相关系数（ACF）的四种典型指数衰减形态
///

!!! info "课堂观察：为什么强正相关的 $\text{AR}(1)$ 时序图看起来像“有趋势”？"
    当 $\varphi_1 = 0.9$（接近 $1$）时，$\rho_1 = 0.9,\ \rho_2 = 0.81,\ \rho_3 = 0.729$，自相关性持续很多期。此时生成的样本轨道具有极强的**惯性**，穿过理论均值 $0$ 的频率很低，会在相当长一段时间内停留在均值 $0$ 的同一侧（上方或下方），给观察者造成一种“序列存在上升或下降趋势”的错觉——**事实上其理论均值在所有时刻恒为 $0$，这种伪趋势完全是由相邻观测值的强正相关性引起的**。

---

## 偏自相关系数（PACF）与 $p$ 阶截尾性

### 为什么要引入偏自相关系数？

在 $\text{AR}(1)$ 模型 $x_t = \varphi_1 x_{t-1} + \varepsilon_t$ 中，尽管 $x_{t-2}$ 并未直接出现在方程中，但由于 $x_t$ 与 $x_{t-1}$ 相关、$x_{t-1}$ 又与 $x_{t-2}$ 相关，中间变量 $x_{t-1}$ 充当了“传声筒”，导致自相关系数 $\rho_2 = \varphi_1^2 \ne 0$（一直拖尾下去）。这使得我们**无法仅凭自相关系数 $\rho_k$ 判断 $\text{AR}(p)$ 模型的真实阶数 $p$**！

为此，我们需要思考：**如果把中间 $k-1$ 个随机变量 $x_{t-1}, x_{t-2}, \dots, x_{t-k+1}$ 的间接传递干扰全部剔除掉（假设它们已知/固定），单独衡量 $x_{t-k}$ 对 $x_t$ 的“直接”线性相关性，结果会如何？** 这就是**偏自相关系数（Partial Autocorrelation Function, PACF）**！

!!! note "定义：延迟 $k$ 阶偏自相关系数（PACF）"
    对于平稳时间序列 $\{x_t\}$，所谓**延迟 $k$ 偏自相关系数**，是指在给定中间 $k-1$ 个随机变量 $x_{t-1}, x_{t-2}, \dots, x_{t-k+1}$ 的条件下（或者说剔除了中间 $k-1$ 个随机变量的线性干扰之后），$x_{t-k}$ 对 $x_t$ 影响的条件相关度量。用数学语言描述为：

    $$
    \rho_{x_t, x_{t-k} \mid x_{t-1}, \dots, x_{t-k+1}} = \frac{E\big[(x_t - \hat{E}x_t)(x_{t-k} - \hat{E}x_{t-k})\big]}{E\big[(x_{t-k} - \hat{E}x_{t-k})^2\big]}
    $$

    其中 $\hat{E}x_t = E(x_t \mid x_{t-1}, \dots, x_{t-k+1})$ 和 $\hat{E}x_{t-k} = E(x_{t-k} \mid x_{t-1}, \dots, x_{t-k+1})$ 分别表示以中间变量对 $x_t$ 和 $x_{t-k}$ 作最小均方误差线性投影（条件数学期望）。

---

### $k$ 阶自回归拟合方程与条件期望推导（课堂板书精要）

直接按上述条件协方差定义计算极其繁琐。课堂上老师通过引入 **$k$ 阶自回归线性拟合方程**，给出了一个极为漂亮的等价转化：

用过去 $k$ 期的序列值 $x_{t-1}, x_{t-2}, \dots, x_{t-k}$ 对当前值 $x_t$ 作 $k$ 阶线性自回归拟合：

$$
x_t = \phi_{k1} x_{t-1} + \phi_{k2} x_{t-2} + \cdots + \phi_{k, k-1} x_{t-k+1} + \phi_{kk} x_{t-k} + \varepsilon_t
$$

!!! tip "双下标记号 $\phi_{kj}$ 的物理含义（课堂重点强调）"
    - **第一个下标 $k$**：表示当前为了求 $k$ 阶偏自相关而人为构造的**拟合回归方程的总阶数**（需要求几阶 PACF，就构造几阶拟合方程）；
    - **第二个下标 $j$**：表示该拟合方程中滞后项 $x_{t-j}$ 对应的第 $j$ 个回归系数；
    - 其中最后一个系数 **$\phi_{kk}$ 恰好就是延迟 $k$ 阶偏自相关系数**！而前面的 $\phi_{k1}, \dots, \phi_{k, k-1}$ 只是求解该线性方程组时的“伴生副产物”。

??? note "点击展开：课堂板书推导——为什么偏自相关系数恰好等于最后一个回归系数 $\phi_{kk}$？"
    在给定中间 $k-1$ 个变量 $\{x_{t-1}, x_{t-2}, \dots, x_{t-k+1}\}$ 已知的条件下，对拟合方程

    $$
    x_t = \phi_{k1} x_{t-1} + \phi_{k2} x_{t-2} + \cdots + \phi_{k, k-1} x_{t-k+1} + \phi_{kk} x_{t-k} + \varepsilon_t
    $$

    两边同时取条件期望 $\hat{E}(\cdot) = E(\cdot \mid x_{t-1}, \dots, x_{t-k+1})$。由于中间变量 $x_{t-1}, \dots, x_{t-k+1}$ 在条件下视为已知常数，其条件期望就是其自身；而白噪声 $\varepsilon_t$ 条件期望为 $0$，因此得：

    $$
    \hat{E}x_t = \phi_{k1} x_{t-1} + \phi_{k2} x_{t-2} + \cdots + \phi_{k, k-1} x_{t-k+1} + \phi_{kk} \hat{E}x_{t-k}
    $$

    将原方程与上式相减，**中间 $k-1$ 项全部完美抵消**！得到残差关系：

    $$
    x_t - \hat{E}x_t = \phi_{kk}(x_{t-k} - \hat{E}x_{t-k}) + \varepsilon_t
    $$

    将上式代入偏自相关系数的定义式分子中，并利用 $\operatorname{Cov}(\varepsilon_t,\ x_{t-k} - \hat{E}x_{t-k}) = 0$：

    $$
    \begin{aligned}
    \rho_{x_t, x_{t-k} \mid x_{t-1}, \dots, x_{t-k+1}}
    &= \frac{E\big[\big(\phi_{kk}(x_{t-k} - \hat{E}x_{t-k}) + \varepsilon_t\big)(x_{t-k} - \hat{E}x_{t-k})\big]}{E\big[(x_{t-k} - \hat{E}x_{t-k})^2\big]} \\
    &= \frac{\phi_{kk} E\big[(x_{t-k} - \hat{E}x_{t-k})^2\big] + 0}{E\big[(x_{t-k} - \hat{E}x_{t-k})^2\big]} \\
    &= \phi_{kk}
    \end{aligned}
    $$

    证毕！因此，**求延迟 $k$ 阶偏自相关系数，完全等价于求解 $k$ 阶自回归拟合方程的最后一个系数 $\phi_{kk}$**！

---

### 用 Yule-Walker 方程与 Cramer 法则求解 $\phi_{kk}$

如何求解 $k$ 阶拟合方程 $x_t = \sum_{j=1}^k \phi_{kj} x_{t-j} + \varepsilon_t$ 中的未知系数 $\phi_{k1}, \dots, \phi_{kk}$？
在方程两边分别乘以 $x_{t-1}, x_{t-2}, \dots, x_{t-k}$，取数学期望并同除以 $\gamma_0$，即得关于未知数 $(\phi_{k1}, \phi_{k2}, \dots, \phi_{kk})^T$ 的 **$k$ 阶 Yule-Walker 矩阵方程组**：

$$
\begin{bmatrix}
1 & \rho_1 & \rho_2 & \cdots & \rho_{k-1} \\
\rho_1 & 1 & \rho_1 & \cdots & \rho_{k-2} \\
\rho_2 & \rho_1 & 1 & \cdots & \rho_{k-3} \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
\rho_{k-1} & \rho_{k-2} & \rho_{k-3} & \cdots & 1
\end{bmatrix}
\begin{bmatrix}
\phi_{k1} \\
\phi_{k2} \\
\phi_{k3} \\
\vdots \\
\phi_{kk}
\end{bmatrix}
=
\begin{bmatrix}
\rho_1 \\
\rho_2 \\
\rho_3 \\
\vdots \\
\rho_k
\end{bmatrix}
$$

!!! important "课堂核心辨析：求 ACF 与求 PACF 时，Yule-Walker 方程的“已知”与“未知”恰恰相反！"
    - **求自相关系数（ACF $\rho_k$）时**：模型的真实阶数 $p$ 和系数 $\varphi_1, \dots, \varphi_p$ 是**已知**的，我们把 $\rho_1, \rho_2, \dots$ 当作**未知数**解出来；
    - **求偏自相关系数（PACF $\phi_{kk}$）时**：无论是对 $\text{AR}$、$\text{MA}$ 还是 $\text{ARMA}$ 模型，**必须先算出前 $k$ 阶自相关系数 $\rho_1, \rho_2, \dots, \rho_k$ 作为已知数**，再代入上述 $k \times k$ 矩阵方程组中，把 $\phi_{kk}$ 当作**未知数**解出来！

由线性代数的 **Cramer（克莱姆）法则**，$\phi_{kk} = \frac{|D_k|}{|D|}$（其中 $|D|$ 为系数矩阵行列式，$|D_k|$ 为将系数矩阵最后一列替换为右侧常数列 $(\rho_1, \dots, \rho_k)^T$ 后的行列式）：

=== "1 阶偏自相关系数 $\phi_{11}$"
    当 $k = 1$ 时，方程仅有一行：$1 \cdot \phi_{11} = \rho_1$，故对**任何平稳模型**恒有：

    $$
    \boxed{\phi_{11} = \rho_1}
    $$

    *(直观理解：$x_t$ 与 $x_{t-1}$ 之间没有任何中间变量需要剔除，因此一阶偏自相关系数永远等于一阶自相关系数！)*

=== "2 阶偏自相关系数 $\phi_{22}$（必背公式！）"
    当 $k = 2$ 时，联立二元一次方程组：

    $$
    \begin{cases}
    \phi_{21} + \rho_1 \phi_{22} = \rho_1 \\[4pt]
    \rho_1 \phi_{21} + \phi_{22} = \rho_2
    \end{cases}
    \implies
    \phi_{22} = \frac{\begin{vmatrix} 1 & \rho_1 \\ \rho_1 & \rho_2 \end{vmatrix}}{\begin{vmatrix} 1 & \rho_1 \\ \rho_1 & 1 \end{vmatrix}}
    $$

    即得通用的**二阶偏自相关系数公式**（对 $\text{AR}$、$\text{MA}$、$\text{ARMA}$ 均适用）：

    $$
    \boxed{\phi_{22} = \frac{\rho_2 - \rho_1^2}{1 - \rho_1^2}}
    $$

=== "3 阶偏自相关系数 $\phi_{33}$"
    当 $k = 3$ 时，由三阶行列式 Cramer 法则：

    $$
    \phi_{33} = \frac{\begin{vmatrix} 1 & \rho_1 & \rho_1 \\ \rho_1 & 1 & \rho_2 \\ \rho_2 & \rho_1 & \rho_3 \end{vmatrix}}{\begin{vmatrix} 1 & \rho_1 & \rho_2 \\ \rho_1 & 1 & \rho_1 \\ \rho_2 & \rho_1 & 1 \end{vmatrix}} = \frac{\rho_3 - 2\rho_1\rho_2 + \rho_1^3 - \rho_1^2\rho_3 + \rho_1\rho_2^2}{(1 - \rho_1^2)(1 - \rho_2) - \rho_1^2(1 - \rho_2)} = \frac{\rho_3(1-\rho_1^2) - \rho_1\rho_2(2-\rho_2) + \rho_1^3}{1 - 2\rho_1^2 + 2\rho_1^2\rho_2 - \rho_2^2}
    $$

---

### 平稳 $\text{AR}(p)$ 模型偏自相关系数的 **$p$ 阶截尾性**

对于一个真实的 $p$ 阶自回归模型 $x_t = \sum_{i=1}^p \varphi_i x_{t-i} + \varepsilon_t$，当我们用 $k$ 阶拟合方程 $\hat{x}_t = \sum_{i=1}^k \phi_{ki} x_{t-i}$ 去逼近 $x_t$ 时，考察当 $k \ge p$ 时的拟合均方误差 $J$：

$$
\begin{aligned}
J &= E\left[\left(x_t - \sum_{i=1}^k \phi_{ki} x_{t-i}\right)^2\right] \\
&= E\left[\left(\sum_{i=1}^p (\varphi_i - \phi_{ki}) x_{t-i} - \sum_{i=p+1}^k \phi_{ki} x_{t-i} + \varepsilon_t\right)^2\right]
\end{aligned}
$$

为了使均方误差 $J \ge \sigma^2$ 达到极小值 $\sigma^2$，最优拟合系数必然取：

- 对前 $p$ 项（$1 \le i \le p$）：$\phi_{ki} = \varphi_i$；
- 对超出 $p$ 阶的所有高阶项（$p + 1 \le i \le k$）：**$\phi_{ki} = 0$**！

由此立即导出平稳 $\text{AR}(p)$ 模型偏自相关系数的核心定阶性质——**==$p$ 阶截尾性（Cutoff after lag $p$）==**：

$$
\boxed{
\begin{cases}
\phi_{pp} = \varphi_p \ne 0, & (k = p \text{ 时，第 } p \text{ 阶 PACF 恰好等于模型最高阶系数 } \varphi_p) \\[6pt]
\phi_{kk} = 0, & (\forall\, k > p \text{，超过 } p \text{ 阶后的 PACF 恒等于 } 0)
\end{cases}
}
$$

!!! warning "课堂做题黄金法则：什么时候可以直接用 $\phi_{kk} = \varphi_k$？"
    老师在课堂上反复强调：
    1. **只有当要求的偏自相关阶数 $k$ 恰好等于 $\text{AR}(p)$ 模型的总阶数 $p$（即 $k = p$）时，才有 $\phi_{pp} = \varphi_p$**！
       - 例如：对 $\text{AR}(2)$ 模型，求二阶 PACF 时可直接写 $\phi_{22} = \varphi_2$，求三阶及更高阶 PACF 时直接写 $\phi_{33} = \phi_{44} = \cdots = 0$（**千万不要去苦算三阶行列式！**）。
    2. **当 $k < p$ 时，$\phi_{kk} \ne \varphi_k$**！
       - 例如：对 $\text{AR}(2)$ 模型，一阶偏自相关系数是 $\phi_{11} = \rho_1 = \frac{\varphi_1}{1-\varphi_2} \ne \varphi_1$；对 $\text{AR}(3)$ 模型，求二阶偏自相关系数 $\phi_{22}$ 时必须用 $\phi_{22} = \frac{\rho_2 - \rho_1^2}{1 - \rho_1^2}$，而**不能**直接写 $\varphi_2$！

---

## 课堂综合大题精讲（期末必考核心题型）

下面完整整理课堂上老师留给同学们限时 10 分钟独立完成、并逐项精讲的 $\text{AR}(2)$ 综合大题（对应课堂 `笔记.md`）：

???+ example "综合实战大题：给定延迟算子形式，求均值、方差、ACF 与 PACF"
    **题目**：已知时间序列模型满足

    $$
    (1 - 0.5B)(1 - 0.3B)x_t = \varepsilon_t, \qquad \{\varepsilon_t\} \sim \text{WN}(0, \sigma^2)
    $$

    1. 将模型化为一般自回归展开形式，并判断其平稳性；
    2. 求序列的数学期望 $E(x_t)$ 与方差 $D(x_t)$；
    3. 求延迟 $k = 1, 2, 3$ 阶的自相关系数 $\rho_1, \rho_2, \rho_3$；
    4. 求延迟 $k = 1, 2, 3$ 阶的偏自相关系数 $\phi_{11}, \phi_{22}, \phi_{33}$。

    ---

    ### 完整解答步骤

    #### 第一步：展开算子多项式并判别平稳性
    将左边算子乘积展开：

    $$
    (1 - 0.8B + 0.15B^2)x_t = \varepsilon_t \quad \implies \quad x_t - 0.8 x_{t-1} + 0.15 x_{t-2} = \varepsilon_t
    $$

    移项得中心化 $\text{AR}(2)$ 模型标准形式：

    $$
    x_t = 0.8 x_{t-1} - 0.15 x_{t-2} + \varepsilon_t
    $$

    对比标准式 $x_t = \varphi_1 x_{t-1} + \varphi_2 x_{t-2} + \varepsilon_t$，读取自回归系数：

    $$
    \varphi_0 = 0, \qquad \varphi_1 = 0.8, \qquad \varphi_2 = -0.15
    $$

    - **平稳性判别（双验证）**：
        - **特征根法**：由因式分解 $(1 - 0.5B)(1 - 0.3B) = 0$ 直接看出特征根为 $\lambda_1 = 0.5,\ \lambda_2 = 0.3$，显然 $|\lambda_1| < 1,\ |\lambda_2| < 1$（全部在单位圆内）；
        - **平稳域法**：$|\varphi_2| = 0.15 < 1$，$\varphi_2 + \varphi_1 = -0.15 + 0.8 = 0.65 < 1$，$\varphi_2 - \varphi_1 = -0.95 < 1$，三个不等式全部满足。
        - 故该 $\text{AR}(2)$ 过程**平稳**（且验证了移项符号无误！）。

    ---

    #### 第二步：求均值 $E(x_t)$
    因为模型为中心化平稳 $\text{AR}(2)$ 模型（$\varphi_0 = 0$），对两边同时取期望：

    $$
    \begin{aligned}
    E(x_t) &= 0.8 E(x_{t-1}) - 0.15 E(x_{t-2}) + E(\varepsilon_t) \\
    &= (0.8 - 0.15) E(x_t) + 0 = 0.65 E(x_t)
    \end{aligned}
    $$

    解得：

    $$
    \boxed{\mu = E(x_t) = 0}
    $$

    ---

    #### 第三步：求自相关系数 $\rho_1, \rho_2, \rho_3$ 与方差 $D(x_t) = \gamma_0$
    *(课堂技巧：先求 $\rho_1, \rho_2$，再代入 $\gamma_0 = \frac{\sigma^2}{1 - \varphi_1 \rho_1 - \varphi_2 \rho_2}$ 比直接解三元自协方差方程组更快！)*

    1. **求 $\rho_1, \rho_2, \rho_3$**：
       利用 $\text{AR}(2)$ 自相关递推式 $\rho_k = \varphi_1 \rho_{k-1} + \varphi_2 \rho_{k-2} = 0.8\rho_{k-1} - 0.15\rho_{k-2}$：
       - 当 $k = 1$ 时：

         $$
         \rho_1 = \frac{\varphi_1}{1 - \varphi_2} = \frac{0.8}{1 - (-0.15)} = \frac{0.8}{1.15} = \frac{16}{23} \approx 0.6957
         $$

       - 当 $k = 2$ 时：

         $$
         \rho_2 = 0.8 \rho_1 - 0.15 \rho_0 = 0.8 \times \frac{16}{23} - 0.15 \times 1 = \frac{12.8 - 3.45}{23} = \frac{9.35}{23} = \frac{187}{460} \approx 0.4065
         $$

       - 当 $k = 3$ 时（直接用递推式往后推！）：

         $$
         \rho_3 = 0.8 \rho_2 - 0.15 \rho_1 = 0.8 \times \frac{187}{460} - 0.15 \times \frac{16}{23} = \frac{149.6 - 48}{460} = \frac{101.6}{460} = \frac{254}{1150} = \frac{127}{575} \approx 0.2209
         $$

    2. **求方差 $\gamma_0 = D(x_t)$**：
       由 $\gamma_0 = \varphi_1 \gamma_1 + \varphi_2 \gamma_2 + \sigma^2 = \gamma_0(\varphi_1 \rho_1 + \varphi_2 \rho_2) + \sigma^2$：

       $$
       \gamma_0 = \frac{\sigma^2}{1 - 0.8 \times \frac{16}{23} - (-0.15) \times \frac{187}{460}} = \frac{\sigma^2}{1 - \frac{256}{460} + \frac{28.05}{460}} = \frac{\sigma^2}{\frac{232.05}{460}} = \frac{460}{232.05}\sigma^2 = \frac{9200}{4641}\sigma^2 \approx 1.9823\sigma^2
       $$

    ---

    #### 第四步：求偏自相关系数 $\phi_{11}, \phi_{22}, \phi_{33}$（秒杀！）
    因为该模型是 **$\text{AR}(2)$ 模型（$p = 2$）**，其偏自相关系数具有 **$2$ 阶截尾性**：
    - **$k = 1$**：一阶偏自相关系数等于一阶自相关系数

      $$
      \boxed{\phi_{11} = \rho_1 = \frac{16}{23} \approx 0.6957}
      $$

    - **$k = 2$**：二阶偏自相关系数直接等于 $\text{AR}(2)$ 的最高阶系数 $\varphi_2$

      $$
      \boxed{\phi_{22} = \varphi_2 = -0.15}
      $$

    - **$k = 3$**：超过 $p = 2$ 阶后直接截尾为 $0$

      $$
      \boxed{\phi_{33} = 0} \qquad (\text{同理 } \phi_{44} = \phi_{55} = \cdots = 0)
      $$

---

## Python 仿真：ACF 指数拖尾与 PACF $p$ 阶截尾可视化

课件中使用 `statsmodels.graphics.tsaplots` 中的 `plot_acf` 与 `plot_pacf` 绘制样本自相关图与偏自相关图。以下脚本可直接复现上述课堂例题 $\text{AR}(2)$ 模型的模拟样本及 ACF / PACF 图像：

```python
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.arima_process import ArmaProcess
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

# 构造课堂例题 AR(2) 模型: x_t - 0.8 x_{t-1} + 0.15 x_{t-2} = e_t
# 注意 statsmodels 中 ar 多项式传入的是 Φ(B) = [1, -φ1, -φ2] 的系数
ar_params = np.array([1.0, -0.8, 0.15])
ma_params = np.array([1.0])
ar_process = ArmaProcess(ar_params, ma_params)

# 1. 验证理论平稳性、理论 ACF 与理论 PACF
print("模型是否平稳:", ar_process.isstationary)
print("理论 ACF (k=0..3):", np.round(ar_process.acf(lags=4), 4))
print("理论 PACF (k=0..3):", np.round(ar_process.pacf(lags=4), 4))

# 2. 生成 N=1000 的样本序列并绘制 ACF（拖尾）与 PACF（2阶截尾）
np.random.seed(42)
y = ar_process.generate_sample(nsample=1000)

fig, axes = plt.subplots(1, 2, figsize=(12, 4))
plot_acf(y, lags=20, ax=axes[0], title="AR(2) Sample ACF (Tailing Off)")
plot_pacf(y, lags=20, ax=axes[1], title="AR(2) Sample PACF (Cutoff after lag 2)")
plt.tight_layout()
plt.show()
```

