---
title: 'DJI 飞行算法流程和问题'
date: 2025-09-26 16:15
comment: True
comments: true
---

## 图像标定信息

DJI 无人机拍摄的图片中包含以下有助于标定的信息：

| 参数 | 描述 | 示例值 |
|------|------|--------|
| `imageWidth` | 总像素宽 | 8192pixel |
| `imageHeight` | 总像素高 | 5460pixel |
| `focalLength` | 焦距 | 35mm |
| `relativeAltitude` | 相对无人机起飞点的高度 | - |
| `absoluteAltitude` | 无人机拍摄画面图像中心高程 | - |
| `latA` | 无人机拍摄画面图像中心纬度 | - |
| `lonA` | 无人机拍摄画面图像中心经度 | - |
| `GimbalRollDegree` | 云台Roll角 | - |
| `GimbalYawDegree` | 云台Yaw角 | - |
| `GimbalPitchDegree` | 云台Pitch角 | - |
| `FlightRollDegree` | 无人机Roll角 | - |
| `FlightYawDegree` | 无人机Yaw角 | - |
| `FlightPitchDegree` | 无人机Pitch角 | - |
| `DewarpData` | 相机内参和畸变参数 | [fx,fy,cx,cy,k1,k2,p1,p2,k3] |

/// table-caption
DJI 无人机图像标定参数表
///

## 推算信息

基于已知参数可以推算出以下信息：

```
sensorWidth      传感器宽度 根据相机型号推算为36.045mm
sensorHeight     传感器高度 根据相机型号推算为24.024mm
hA               拍摄地平面的高程 推算为 absoluteAltitude - relativeAltitude
```

## 未知信息和问题

### 相机标定问题

相机**内参矩阵**和**畸变矩阵**矫正方式不明确。目前参考了[此链接](https://zhuanlan.zhihu.com/p/68269214)的计算方式，但转换需要理论依据，且开启矫正和关闭对精度帮助不明显。

### 坐标系问题

在**姿态角均为0下（初始状态）**图像方位与北东地参考系的关系不明确：

- 图像右指和下指分别指向北、东、地的正向还是反向？
- 当前方案选为**图像右指**对应西向，**图像下指**对应天向

### 旋转中心问题

`rotateCenter(x,y,z)` 云台姿态角旋转中心不明确：

- 以焦点为旋转中心
- 以CMOS传感器为旋转中心

算法中计算结果差距没有明显优劣。

### 欧拉旋转问题

执行欧拉旋转函数时 `GimbalxxxDegree` 和 `FlightxxxDegree` 与实际云台旋转关系不明确。

当前方案：
- 参考系选为**北东地参考系**
- **仅使用GimbalxxxDegree**
- 按照**ZYX顺序**做**内旋**

## 算法流程

### 完整计算步骤

1. **输入参数**：上述参数和待计算像素坐标 `(targetX, targetY)` 以左上角为原点

2. **坐标转换**：做偏移得到以图像中心为原点的坐标系
   ```
   X轴正向：图像右指
   Y轴正向：图像下指
   坐标：(targetOffsetX, targetOffsetY)
   ```

3. **相机校正**：执行相机内参校正和畸变校正函数
   ```
   返回：校正后的xy像素偏移量 (correctedX, correctedY)
   ```

4. **物理转换**：应用传感器长宽和图像长宽
   ```
   得到：物理偏移量 (correctXmm, corectedYmm)
   ```

5. **坐标系转换**：转换为以镜头焦点为原点的北东地参考系坐标
   ```
   (northmm, eastmm, downmm) = (-focalLengthmm, -correctXmm, -corectedYmm)
   ```

6. **欧拉旋转**：对坐标执行欧拉旋转
   ```
   输入：(northmm, eastmm, downmm)
   输出：(rNorthmm, rEastmm, rDownmm)
   ```

7. **焦点处理**：焦点 `(0, 0, 0)` 为原点，欧拉旋转值不变

8. **射线交点计算**：
   ```
   射线：从 (0, 0, 0) 到 (rNorthmm, rEastmm, rDownmm)
   平面：z = relative_altitude
   交点：(intersectionNorth, intersectionEast, intersectionDown)
   ```

9. **相对偏移**：`(intersectionNorth, intersectionEast, intersectionDown)` 为相对于标定点无人机的偏移量

10. **最终坐标**：通过已知无人机经纬度高程和北东地偏移，使用以下函数求得标定点坐标：

    ```c
    lla_offset_to_lla(
        double lonA, double latA, double hA,
        double north, double east, double up
    )
    ```

## 改进建议

1. **相机标定**：建立完整的相机标定流程，确定内参和畸变参数的准确性
2. **坐标系统一**：明确定义各个坐标系之间的转换关系
3. **旋转中心验证**：通过实际测试确定最优的旋转中心选择
4. **参数验证**：设计实验验证欧拉角参数的使用方式

这套算法为 DJI 无人机图像的地理坐标标定提供了完整的解决方案，但仍需要进一步的理论验证和实验优化。