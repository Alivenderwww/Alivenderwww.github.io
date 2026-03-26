---
title: "TurboQuant论文解读"
date: 2026-03-26 16:54
comment: true
comments: true
---

近日Google在ICLR 2026发表的论文 **《TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate》** 引起了业界的广泛关注。在LLM推理中，**KV Cache**随着上下文长度增加，显存占用呈线性增长。行业内一般做法是对KV Cache做量化压缩，而这篇论文给出了一个近乎完美的数学解答。

## 传统的KV Cache量化

在 LLM 中，Attention 机制的核心是计算 Query ($q$) 与 Key ($k$) 的**内积（Inner Product）**。

传统的量化（如 PQ）虽然能压缩向量，但由于量化过程引入的统计偏差，导致计算出的内积与原始内积相比存在偏差（Bias）。在大模型成千上万次的自回归生成中，这种微小的偏差会经过 Softmax 函数放大，最终导致模型生成的文本逻辑混乱。

**TurboQuant 的目标**：在压缩显存的同时，保证内积计算的**无偏性（Unbiased）**。

## TurboQuant 量化操作

### 随机旋转（Lemma 1）

LLM 的特征向量中往往存在极大的异常值（Outliers），直接量化会导致大误差。

在线性代数中，一个 $d$ 维向量是空间里的一个带方向的箭头。假设 $d=2$，有一个向量 $x = \begin{bmatrix} 3 \\ 4 \end{bmatrix}$。

#### 归一化

**1. 求模长（长度）：**
根据勾股定理，它的长度 $\|x\|_2 = \sqrt{3^2 + 4^2} = 5$。

**2. 归一化（落在球面上）：**
为了方便研究，论文的第一步总是假设向量的长度是 1。

$$x_{norm} = \begin{bmatrix} 3/5 \\ 4/5 \end{bmatrix} = \begin{bmatrix} 0.6 \\ 0.8 \end{bmatrix}$$

现在$\sqrt{0.6^2 + 0.8^2} = 1$。在 $d$ 维空间里（比如 $d=128$），这个向量就落在了一个 d 维的超球面（Hypersphere, $\mathbb{S}^{d-1}$）上。

#### 随机旋转

在线性代数里，**矩阵就是对向量的变换操作**。
如果一个矩阵是“正交矩阵（Orthogonal Matrix）”，它对向量的操作就**只有旋转，没有拉伸或压缩**。

**举一个二维旋转的例子**，
假设我们有一个逆时针旋转 90 度的矩阵：

$$R = \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}$$

拿它去乘我们刚才的向量 $\begin{bmatrix} 0.6 \\ 0.8 \end{bmatrix}$：

$$y = R \cdot x = \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} \begin{bmatrix} 0.6 \\ 0.8 \end{bmatrix} = \begin{bmatrix} -0.8 \\ 0.6 \end{bmatrix}$$

原来的坐标是 (0.6, 0.8)，旋转后变成了 (-0.8, 0.6)。但它的长度 $\sqrt{(-0.8)^2 + 0.6^2}$ 依然是 1。

而TurboQuant生成了一个 $d \times d$ 的**完全随机的正交矩阵 $\Pi$**，对向量$x$进行旋转后，得到 $y = \Pi \cdot x$。由于 $\Pi$ 是随机的，$y$ 的方向也是完全随机的。$x$旋转完后可能停在球表面上的**任何一个点**，这就是论文里说的"旋转后的向量 $y = \Pi \cdot x$ ，是一个均匀分布在单位球面上的随机变量"。

而正交矩阵有一个性质：**它的逆矩阵等于它的转置矩阵**
即：$\Pi^{-1} = \Pi^T$。

这意味着我们可以使用正交矩阵对原始数据进行无损编解码。当你需要用到原来的 $x$ 时，你只需要拿 $y$ 乘上 $\Pi^T$，原来的 $x$ 就会恢复。

$$x' = \Pi^T \cdot y = \Pi^T \cdot (\Pi \cdot x) = (\Pi^T \Pi) \cdot x = I \cdot x = x$$

在计算 Query 向量 $q$ 和 Key 向量 $k$ 的内积时，TurboQuant 并不需要真的把所有的 $k$ 都变回原来的数，而是利用了内积的分配律。

标准的内积是$\text{Score} = q^T \cdot k$，在 TurboQuant 中，$k$ 在显存里是以 $\tilde{y}$ 的形式存着的（且是被 $\Pi$ 旋转过的）。
当要计算内积时，程序实际运行的公式是：

$$\text{Score} = q^T \cdot (\Pi^T \cdot \tilde{y})$$

根据线性代数的结合律，方便GPU加速，这段代码有两种等价的算子融合方式：

1. 把 $\Pi^T$ 乘给 $\tilde{y}$ 恢复出 $\tilde{x}$，然后再去和 $q$ 算点积。（论文 Algorithm 1 里的 `DeQuant` 步骤）。
2. 或者，把查询向量 $q$ 乘以 $\Pi$ 旋转过去（$q' = \Pi \cdot q$），然后直接用 $q'$ 去和量化后的 $\tilde{y}$ 算内积。
   
$$q^T \cdot \Pi^T \cdot \tilde{y} = (\Pi q)^T \cdot \tilde{y} = q'^T \cdot \tilde{y}$$

#### Beta分布

现在我们已经拿到了一个均匀分布在球面上的随机变量 $y$，需要对它进行量化。由于 $y$ 的每个维度都是独立同分布的，我们可以把问题简化为**对单个数字进行量化**。

线性代数证明了，经过随机旋转后的每个维度 $y_i$ 都服从一个特定的 Beta 分布。

$$f_X(x) = \frac{\Gamma(d/2)}{\sqrt{\pi} \Gamma((d-1)/2)} (1 - x^2)^{\frac{d-3}{2}}$$

!!! info
    当 $d \to \infty$ 时，微积分极限公式 $(1 - \frac{t}{n})^n \to e^{-t}$ 会让这个式子收敛成高斯分布 $e^{-d \cdot x^2 / 2}$，这也是论文说的高维特征会变成钟形曲线。

实际上$y$的概率分布长什么样不重要，它的概率分布是**统一的**很重要，这样我们就可以离线预计算出一套量化方案了。

### MSE 标量量化（Theorem 1）

既然特征已经被打散成符合高斯分布的“钟形曲线”，我们就可以离线预计算出一套最优的桶。我们的任务是只用 $b$ 个比特（也就是 $2^b$ 个桶/刻度）去存放这些浮点数，使**均方误差（MSE）最小**。

基本上我们要做的就是在[-1,1]区间内概率密度高的区域分配更多的桶，在概率密度低的区域分配更少的桶，寻找 $2^b$ 个中心点 $c_1, c_2, ..., c_{2^b}$，使得所有点被归入最近的中心点后，误差的平方乘以它的概率，总和最小：

$$\min \sum \int (x - c_i)^2 \cdot f_X(x) dx$$

因为概率分布 $f_X(x)$ 已经由 Lemma 1 确定了，这个积分是一个最优化问题。我们可以离线把这些最佳中心点 $c_i$ 算出来。

具体计算流程如下：

1. 假设有 $b$ 个比特，把曲线切成 $N = 2^b$ 段；
2. 每一段（桶）的平均宽度大约是 $W \propto \frac{1}{2^b}$；
3. 当一个真实的浮点数落入这个桶时，我们只能用“桶的中心点”来代替它；
4. 最大的误差（偏离中心的距离）是半个桶宽：$E = \frac{W}{2} \propto \frac{1}{2^b}$；
5. 均方误差（MSE）是误差的平方：$\text{MSE} \approx E^2 \propto \left(\frac{1}{2^b}\right)^2 = \frac{1}{4^b}$。

结合连续分布概率积分，前人早就证明了最佳量化误差的上界公式。把我们推导的 $f_X(x)$ 代进去，就得到了 Theorem 1 的结论：
每个维度的期望均方误差：$\mathcal{C}(f_X, b) \le \frac{\sqrt{3\pi}}{2 d} \cdot \frac{1}{4^b}$。
总共 $d$ 个维度加起来：

$$D_{mse} \le \frac{\sqrt{3\pi}}{2} \cdot \frac{1}{4^b}$$

### QJL 内积无偏估计（Theorem 2）

很多算法 MSE（均方误差）做得很漂亮，但一放到大模型里算 Attention 就崩溃，原因就是**内积有偏差（Bias）**。

在量化时（尤其是低比特），用少量的离散中心点代替连续的值，这种操作会产生一种叫**收缩效应（Shrinkage Effect）**的现象：量化后的向量，其长度和投影往往会比真实的向量“缩水”一圈（论文中提到 1-bit 下内积会缩水到原来的 $2/\pi \approx 63.6\%$）。

在计算 Attention 分数$\langle y, x \rangle$时，如果每次算出来的值都只有真实的 63.6%，经过 Softmax 放大后，注意力权重就会出问题。

学术界之前发明了 QJL (Quantized JL transform) 的数学技巧（对应论文的 Lemma 4）。它拿一个高斯随机矩阵 $S$ 乘上向量 $x$，然后**只保留正负号**，即量化为 $+1$ 和 $-1$。这样算出来的内积，在**统计期望**上等于原内积，即该操作是无偏的。但是虽然期望很准，但它的**方差太大了**。如果直接用 QJL，算出来的分数乱跳，大模型同样会崩溃。

既然 MSE 方差小但有偏差，QJL 无偏差但方差大，论文就做了一个**两阶段量化**的办法：

1. **MSE量化**：用目标比特数减一（$b-1$ bits），做一个 `TurboQuant_mse`。这样得到 $\tilde{x}_{mse}$，它的方差极小，但带有一点点偏差。
2. **找残差**：残差向量 $r = x - \tilde{x}_{mse}$。这个残差 $r$ 就是 MSE 量化丢失的部分，虽然它的长度很小，但它包含了内积计算中关键的偏差信息。
3. **QJL量化**：用剩下的 1 个 bit，对这个小残差 $r$ 做 QJL 量化，得到 $\tilde{x}_{qjl}$。因为 QJL 的方差是和输入向量的长度成正比的。残差 $r$ 的长度极小，所以QJL的方差也不会很高。同时，QJL又把第一阶段丢失的内积偏差给补了回来。

接下来我们来证明一下，为什么这个两阶段的组合能够同时保证内积的无偏性和方差的上界。

#### 变量定义

1. 向量 $x, y \in \mathbb{R}^d$。
2. $b-1$ 比特的 MSE 量化结果：$\tilde{x}_{mse} = Q^{-1}_{mse}(Q_{mse}(x))$。
3. 残差向量：$r = x - \tilde{x}_{mse}$。
4. 残差的 QJL 量化结果：$\tilde{x}_{qjl} = \sqrt{\frac{\pi/2}{d}} \|r\|_2 S^T \text{qjl}$，其中 $\text{qjl} = \text{sign}(S \cdot r)$。
5. 最终重构向量：$\tilde{x} = \tilde{x}_{mse} + \tilde{x}_{qjl}$。

#### 引理

根据论文预备知识中的 Lemma 4（QJL的性质），对于任意输入向量 $r$ 和查询向量 $y$：
1. **无偏性**：$\mathbb{E}_S[\langle y, \tilde{x}_{qjl} \rangle] = \langle y, r \rangle$
2. **方差界**：$\text{Var}_S(\langle y, \tilde{x}_{qjl} \rangle) \le \frac{\pi}{2d} \|r\|_2^2 \|y\|_2^2$

#### 证明绝对无偏性 (Expected Inner-product)

我们要证明：$\mathbb{E}[\langle y, \tilde{x} \rangle] = \langle y, x \rangle$

假设第一阶段的 $\tilde{x}_{mse}$ 是已经算好固定下来的（即求条件期望）。

$$\mathbb{E}[\langle y, \tilde{x} \rangle \mid \tilde{x}_{mse}] = \mathbb{E}[\langle y, \tilde{x}_{mse} + \tilde{x}_{qjl} \rangle \mid \tilde{x}_{mse}]$$

根据内积的线性分配律：

$$= \langle y, \tilde{x}_{mse} \rangle + \mathbb{E}[\langle y, \tilde{x}_{qjl} \rangle \mid \tilde{x}_{mse}]$$

由于 $\tilde{x}_{mse}$ 固定，残差 $r$ 也是固定的。根据无偏性：

$$= \langle y, \tilde{x}_{mse} \rangle + \langle y, r \rangle$$

把残差的定义 $r = x - \tilde{x}_{mse}$ 代入进去：

$$= \langle y, \tilde{x}_{mse} \rangle + \langle y, x - \tilde{x}_{mse} \rangle$$

$$= \langle y, \tilde{x}_{mse} \rangle + \langle y, x \rangle - \langle y, \tilde{x}_{mse} \rangle$$

$$= \langle y, x \rangle$$

在条件期望下，它已经等于真实内积了。

最后，根据概率论的**全期望公式** $\mathbb{E}[Z] = \mathbb{E}_X[\mathbb{E}[Z|X]]$，去掉条件限制：

$$\mathbb{E}[\langle y, \tilde{x} \rangle] = \mathbb{E}_{\tilde{x}_{mse}}[\langle y, x \rangle] = \langle y, x \rangle$$


#### 证明方差上界 (Inner-product Distortion)

证明 Theorem 2 里的方差公式：$D_{prod} \le \frac{\sqrt{3}\pi^2 \|y\|_2^2}{d} \cdot \frac{1}{4^b}$

$D_{prod}$ 定义为估算内积与真实内积的平方误差的期望（即方差）：

$$D_{prod} = \mathbb{E}[ (\langle y, x \rangle - \langle y, \tilde{x} \rangle)^2 ]$$

同样先求基于 $\tilde{x}_{mse}$ 的条件方差。代入 $\tilde{x} = \tilde{x}_{mse} + \tilde{x}_{qjl}$ 

$$\mathbb{E}[ (\langle y, x \rangle - \langle y, \tilde{x}_{mse} + \tilde{x}_{qjl} \rangle)^2 \mid \tilde{x}_{mse} ]$$

合并同类项，把 $x - \tilde{x}_{mse}$ 变成残差 $r$：

$$= \mathbb{E}[ (\langle y, r \rangle - \langle y, \tilde{x}_{qjl} \rangle)^2 \mid \tilde{x}_{mse} ]$$

因为 $\langle y, r \rangle$ 正好是 $\langle y, \tilde{x}_{qjl} \rangle$ 的数学期望，所以这个式子在定义上就是 **QJL 估计量的方差**。

$$= \text{Var}(\langle y, \tilde{x}_{qjl} \rangle \mid \tilde{x}_{mse})$$

根据 Lemma 4 的方差界可得

$$\le \frac{\pi}{2d} \|r\|_2^2 \|y\|_2^2$$

在两边同时套上对外层（$\tilde{x}_{mse}$）的数学期望，使用全期望公式消除条件：

$$D_{prod} \le \mathbb{E}_{\tilde{x}_{mse}}\left[ \frac{\pi}{2d} \|r\|_2^2 \|y\|_2^2 \right]$$

把常数项提出来：

$$D_{prod} \le \frac{\pi \|y\|_2^2}{2d} \cdot \mathbb{E}[\|r\|_2^2]$$

$\mathbb{E}[\|r\|_2^2]$ 是 $x - \tilde{x}_{mse}$，所以 $\mathbb{E}[\|x - \tilde{x}_{mse}\|_2^2]$ 正好就是第一阶段 **MSE 量化的均方误差 $D_{mse}$**。

$$D_{prod} \le \frac{\pi \|y\|_2^2}{2d} \cdot D_{mse}$$

根据我们在 Theorem 1 推导的结论，使用 $b-1$ 个比特时的 $D_{mse}$ 上界是：

$$D_{mse}(b-1) \le \frac{\sqrt{3}\pi}{2} \cdot \frac{1}{4^{b-1}}$$

注意 $\frac{1}{4^{b-1}} = \frac{4}{4^b}$。把这个代入上面的式子：

$$D_{prod} \le \frac{\pi \|y\|_2^2}{2d} \cdot \left( \frac{\sqrt{3}\pi}{2} \cdot \frac{4}{4^b} \right)$$

把分子分母的常数乘起来：$\pi \times \sqrt{3}\pi \times 4 = 4\sqrt{3}\pi^2$；分母 $2d \times 2 = 4d$。

$$D_{prod} \le \frac{4\sqrt{3}\pi^2 \|y\|_2^2}{4d \cdot 4^b}$$

约掉上下都有的 $4$：

$$D_{prod} \le \frac{\sqrt{3}\pi^2 \|y\|_2^2}{d} \cdot \frac{1}{4^b}$$

### 与理论上界的比较

前面我们推导了 Theorem 1 和 Theorem 2，证明了 TurboQuant 的误差是 $O(\frac{1}{4^b})$。

论文的 **Theorem 3（Lower Bounds）**证明了就算再有什么神仙算法，都不可能比 TurboQuant 好太多了。

用$b$个比特去压缩一个连续的信号会不可避免丢失的信息，丢失的信息占全部信息的比例为失真率$D$，而$D$存在一个*香农下界*：

$$D \ge \frac{1}{4^b}$$

香农下界是针对“已知数据分布（均匀分布）”的极限。
但在最坏情况下，姚期智提出了 Minimax 原理：

> “对于任何一个允许使用随机化（比如随机旋转 $\Pi$）的算法，它在面对**最坏输入**时的表现，其下限绝对不会低于：最好的确定性算法在面对**最难的随机分布**时的表现。”

因此任何算法在最坏情况下的 MSE，一定会受到香农下界的制约，即：
$$ D_{mse}(Q) \ge \frac{1}{4^b} $$

而TurboQuant的误差为$\frac{\sqrt{3\pi}}{2} \cdot \frac{1}{4^b}$，把前面那个常数算一下：$\frac{\sqrt{3 \times 3.14159}}{2} \approx \frac{3.069}{2} \approx \mathbf{1.53}$ 。论文提到了对于低比特，常数有优化，大$b$极限下大概是 $2.7$，实际低比特比如 $b=1$ 时常数约等于 $1.45$ 左右，也就是说仅仅比允许的最小物理误差多了**1.5 到 2.7 倍**而已。

### 对比向量数据库 (Vector DB)

虽然这篇论文的大背景是在讲LLM的 KV Cache，但在4.4 节（Near Neighbour Search Experiments），论文顺手去砸了向量数据库领域的场子，如Milvus, Qdrant, Pinecone。

在 RAG（检索增强生成）中，我们需要在大规模向量库里找最相似的文档。
目前工业界常用的算法是 **PQ（Product Quantization，乘积量化）**。

PQ 需要用 K-means 聚类在数据上训练一个密码本（Codebook）。如果是动态新增的数据，PQ 还要重新校准。

论文尝试了用TurboQuant做向量检索。TurboQuant 不需要训练密码本，拿到向量，乘个随机矩阵就直接变成bit了（见论文表2，耗时 0.001 秒，而对比方法 RabitQ 要 2267 秒）。因为内积是严格无偏的，即使只用 2-bit，TurboQuant 在 top-k 召回率上依然把经过复杂训练的 PQ 和 RabitQ 吊起来打。

## 简单复现demo

```python
import numpy as np

# ==========================================
d = 2048              # 向量维度
outlier_scale = 20.0  # 异常值放大倍数 模拟Massive Outliers
b = 4                 # 目标量化比特数
use_qjl = True        # 是否使用 1-bit QJL 残差补偿 True=TurboQuant_prod, False=TurboQuant_mse
np.random.seed(12345) # 种子，方便复现结果

# ==========================================
# 系统初始化与生成随机正交矩阵
# ==========================================
print(f"--- TurboQuant demo (d={d}, b={b}-bit, QJL={use_qjl}), seed={np.random.get_state()[1][0]} ---")
np.set_printoptions(formatter={'float': '{: 0.3f}'.format})
# 生成完全随机的正交旋转矩阵 Pi
# 用 QR 分解来获取正交矩阵
H = np.random.randn(d, d)
Pi, _ = np.linalg.qr(H)

# 生成 QJL 所需的高斯随机投影矩阵 S

# ==========================================
# 构造数据
# ==========================================
# 构造原始向量 x
x = np.random.randn(d)
x[0] = x[0] * outlier_scale
# print(f"向量 x: {x}")
x = x / np.linalg.norm(x)    # 归一化到单位球面

# 构造查询向量 y
y = np.random.randn(d)
y = y / np.linalg.norm(y)

exact_score = y @ x 

print(f"\n[原始特征观察]")
print(f"向量 x 的最大绝对值: {np.max(np.abs(x)):.4f}")
print(f"全精度内积 (Target): {exact_score:.6f}") # 看看

print(f"\n[原始特征观察]")
# print(f"向量 x: {x}")
print(f"向量 x 的最大绝对值: {np.max(np.abs(x)):.4f}")
print(f"向量 x 的标准差: {np.std(x):.4f}")

# ==========================================
# 旋转与基础量化 (TurboQuant_mse)
# ==========================================
b_mse = (b - 1) if use_qjl else b 

print(f"\n[步骤 1: 随机旋转 (打平异常值)]")
x_rot = Pi @ x

# print(f"向量 x: {x_rot}")
print(f"旋转后 x_rot 的最大绝对值: {np.max(np.abs(x_rot)):.4f}")
print(f"旋转后 x_rot 的标准差: {np.std(x_rot):.4f} (1/sqrt(d) = {1/np.sqrt(d):.4f})")

# 构建 Codebook (密码本) 并量化
if b_mse > 0:
    # --- 量化计算 ---
    levels = 2 ** b_mse
    sigma = 1.0 / np.sqrt(d)
    
    codebook = np.linspace(-3.5 * sigma, 3.5 * sigma, levels)
    
    indices = np.abs(x_rot[:, None] - codebook[None, :]).argmin(axis=1)
    x_rot_quant = codebook[indices]
    x_mse_recon = Pi.T @ x_rot_quant
    
    mse_only_score = y @ x_mse_recon
    # 计算偏差比例：理想情况下应该接近 100%，但 MSE 量化通常会“缩水”到 60%-80%
    bias_ratio = (mse_only_score / exact_score) if abs(exact_score) > 1e-9 else 0
    
    print(f"\n[诊断：MSE 阶段分析]")
    print(f"全精度分数 (Target): {exact_score:.6f}")
    print(f"MSE 重建分数:        {mse_only_score:.6f}")
    print(f"偏差比例 (Bias):  {bias_ratio:.2%} (理想 100%)")
    
    # 记录残差
    r = x - x_mse_recon
    gamma = np.linalg.norm(r)
else:
    x_mse_recon = np.zeros(d)
    r = x
    gamma = 1.0

print(f"\n[步骤 2: {b_mse}-bit 基础量化重建]")
mse_error = np.linalg.norm(x - x_mse_recon)**2
print(f"仅使用 MSE 重建的均方误差: {mse_error:.4f}")

# ==========================================
# 计算残差并使用 QJL (TurboQuant_prod)
# ==========================================
if use_qjl:
    final_scores = []
    for i in range(100):
        S_new = np.random.randn(d, d) # 模拟不同的随机投影
        qjl_signs_new = np.sign(S_new @ r)
        x_qjl_recon_new = (np.sqrt(np.pi / 2.0) / d) * gamma * (S_new.T @ qjl_signs_new)
        final_scores.append(y @ (x_mse_recon + x_qjl_recon_new))
    
    avg_score = np.mean(final_scores)
    print("\n" + "="*45)
    print(f"全精度目标值: {exact_score:.6f}")
    print(f"100次 TurboQuant 平均值: {avg_score:.6f} (误差: {abs(exact_score - avg_score):.6f})")
    print(f"单一 MSE (无无偏补丁) 值: {mse_only_score:.6f} (误差: {abs(exact_score - mse_only_score):.6f})")
else:
    x_final_recon = x_mse_recon
    print(f"\n[步骤 3: 未开启 QJL，跳过残差补偿]")
    exact_score = y @ x
    quant_score = y @ x_final_recon
    error = abs(exact_score - quant_score)

    print("\n" + "="*45)
    print(f"1. 全精度目标值:   {exact_score:8.5f}")
    print(f"2. {b}-bit TurboQuant 内积:    {quant_score:8.5f}")
    print(f"3. 绝对误差 (|差值|):        {error:8.5f}")
```