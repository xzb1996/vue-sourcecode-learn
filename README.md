# vue源码学习

### 简介
vue3都要出了，我连2的源码都还没分析，太不像话了，简单记录一些自己的学习过程(vue核心代码)，通过添加注释来加深自己的理解，如若理解有偏差或者错误的地方，欢迎指出，共同进步。

我分成了[vue-src](./vue-src)、[vuex-src](./vuex-src)、[vue-router-src](./vue-router-src)三个文件夹来分别存放代码，下面我会将学习的过程放在下面。

---

### 目录

##### 入口
在`core/instance/index.js`中调用_init函数进行初始化
可以在`core/instance/init.js`中看到，_init函数进行了一系列的初始化以及$mount组件。

---


