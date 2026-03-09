---
title: "SystemC学习笔记"
date: 2026-01-03
authors:
  - Alivender
hide:
    - feedback
categories:
  - 编程
comment: true
comments: true
---

<!-- more -->

```systemc
#include <systemc.h>

SC_MODULE( and2 ) {
    sc_in<DT>   a, b;
    sc_out<DT>  f;

    void func() {
        f.write( a.read() & b.read() );
    }

    SC_CTOR( and2 ) {
        SC_METHOD( func );
        sensitive << a << b;
    }
}
```

SystemC使用`.read()`和`.write()`方法进行端口读写：

```systemc
x = input.read();
output.write(val);
```

SystemC通过线程来模拟硬件的并行行为：

SystemC有三种主要的进程类型：
- `SC_METHOD` 每次敏感事件触发时完全执行一次，与verilog的`@always`对应。可综合。适用于组合逻辑或者小型顺序逻辑。
- `SC_THREAD` 在仿真开始时启动一次，完成后暂停。可以放置无限循环语句。与verilog的`@initial`对应。不可综合。适用于tb中描述时钟或者初始化信号。
- `SC_CTHREAD` `CTHREAD`的含义是"clocked thread"，即时钟触发的线程。与`SC_METHOD`不同的是，`SC_CTHREAD`的执行需要一个或多个时钟周期。可综合。99%的高层次行为级设计用的是它。

```systemc
#include <systemc.h>

SC_MODULE( and2 ) {
    sc_in<DT>   a;
    sc_in<DT>   b;
    sc_in<bool> clk;
    sc_out<DT>  f;

    void func() {
        f.write( a.read() & b.read() );
    }

    SC_CTOR( and2 ) {
        SC_METHOD( func );
        sensitive << clk.pos();
        // sensitive << clk.neg();
    }
}
```

上面的`<DT>`是自定义数据类型。

SystemC的Interger Datatyoes是bit-accurate的，有固定位宽而不是C int type的32位。

- `sc_uint<N>`：无符号整数，宽度为N位。以`sc_uint<3>`为例，表示一个3位的无符号整数，取值范围为0到7。
- `sc_int<N>`：有符号整数，宽度为N位。以`sc_int<3>`为例，表示一个3位的有符号整数，取值范围为-4到3。

```systemc
#include <systemc.h>

SC_MODULE( and2 ) {
    sc_in<sc_uint<1>>   a, b;
    sc_out<sc_uint<1>>  f;
    sc_in<bool> clk;

    void func() {
        f.write( a.read() & b.read() );
    }

    SC_CTOR( and2 ) {
        SC_METHOD( func );
        sensitive << clk.pos();
        // sensitive << clk.neg();
    }
}
```

函数的基本写法：

```systemc
void module_name::func_name() {
    // Reset code
    // Reset internal variables
    // Reset outputs
    wait();

    while (true) {
        // Read inputs
        // Algorithm code
        // Write outputs
        wait();
    }
}
```

```systemc
const sc_int<16> coeffs[5] = {3, -2, 0, 2, 1};

void fir::fir_main(void) {
    sc_int<16> taps[5];
    // Reset
    outp.write(0);
    wait();

    while (true) {
        for (int i = 5-1; i > 0; i--) {
            taps[i] = taps[i-1];
        }
        taps[0] = inp.read();

        sc_int<16> acc = 0;
        for (int i = 0; i < 5; i++) {
            acc += taps[i] * coeffs[i];
        }

        outp.write(acc);
        wait();
    }
}
```