---
title: '脉动阵列计算全连接层'
date: 2025-12-08 22:14
comment: True
comments: true
---

## 脉动阵列计算全连接层

使用 $k*k$ 矩阵计算 $(h_i*w_i)\cdot(1*h_i)$

### 方案1: 权重和输入定向传递，乘加结果静止（矩阵乘法）

最终计算结果分布在各个PE内，需要把所有PE都读出的逻辑。

k小于w的情况下，记 $r=\frac{w}{k}$，每次输入k行权重，相当于 $w \rightarrow k$，$h \rightarrow r\cdot h$

阵列启动时间为 $t_{start}$.

第一个数据在矩阵的左上角PE单元输出，需要的周期数为 $h+t_{start}$ .

全部算完需要 $r\cdot h + t_{start} = \frac{w\cdot h}{k}+t_{start}$ 个周期。

假设 $t_{start} = k - 1$，以 $h=1024$，$w=4096$，$k=64$ 为例，第一个数据输出周期数为$1031$，总周期数为$65599$。

### 方案2：输入和乘加结果定向传递，权重静止（固定卷积核）

最终计算结果都在最底行的PE内，仅需要把最底行PE读出，但是需要事先把权重装载至PE阵列中。

如果 $k$ 小于 $h$，一次输入算不完，还得把底行的PE乘加结果送到顶层作为乘加初始值。

记 $r=\frac{w}{k}$, $s=\frac{h}{k}$，每次 $k\cdot k$ 权重更新所需周期为$t_{load\_block}$，每次将底层PE结果送到顶层所需周期为 $t_{shift\_block}$，阵列启动时间为 $t_{start}$.

对于最差情况（权重更新、PE底层与顶层乘加结果传递不与其他计算重叠），第一个数据输出于阵列左下角，所需周期为：

$$
s\cdot(k+t_{load\_block}) + (s-1)\cdot t_{shift\_block} + t_{start}
$$

所有数据输出所需周期为：

$$
r\cdot \big( s\cdot(k+t_{load\_block}) + (s-1)\cdot t_{shift\_block} \big) + t_{start}
$$

假定 $t_{shift\_block} = 0$，得第一个数据输出所需周期为：

$$
\frac{h}{k}\cdot(k+t_{load\_block}) + t_{start}
$$

假定 $t_{shift\_block} = 0$，得总周期数为：

$$
\frac{wh}{k^2}\cdot (k+t_{load\_block}) + t_{start}
$$

进一步假定 $t_{load\_block}$ 与输入过程重叠，则第一个数据输出所需周期为：

$$
\frac{h}{k}\cdot max\{k,t_{load\_block}\} + t_{start}
$$

进一步假定 $t_{load\_block}$ 与输入过程重叠，则总周期数为：

$$
\frac{wh}{k^2}\cdot max\{k,t_{load\_block}\} + t_{start}
$$

进一步假定 $t_{load\_block} \le k$，则第一个数据输出所需周期为：

$$
h + t_{start}
$$

进一步假定 $t_{load\_block} \le k$，则总周期数为：

$$
\frac{wh}{k} + t_{start}
$$

若 $t_{load\_block}$ 不与输入过程重叠，假定 $t_{load\_block} = k$，则第一个数据输出所需周期为：

$$
2h + t_{start}
$$

若 $t_{load\_block}$ 不与输入过程重叠，假定 $t_{load\_block} = k$，则总周期数为：

$$
\frac{2wh}{k} + t_{start}
$$