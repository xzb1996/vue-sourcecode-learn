# vue源码学习

### 简介
vue3都要出了，我连2的源码都还没分析，太不像话了，简单记录一些自己的学习过程(vue核心代码)，通过添加注释来加深自己的理解，如若理解有偏差或者错误的地方，欢迎指出，共同进步。

我分成了[vue-src](./vue-src)、[vuex-src](./vuex-src)、[vue-router-src](./vue-router-src)三个文件夹来分别存放代码，下面我会将学习的过程放在下面。

---

### 目录

##### 入口
在`core/instance/index.js`中调用_init函数进行初始化
可以在`core/instance/init.js`中看到，_init函数进行了一系列的初始化以及$mount组件。

- [Vue响应式原理](./vue-src/src/core/observer/index.js)---响应式原理依赖于Object.defenProperty，通过设置对象属性的set和get方法来监听数据变化，通过get来进行依赖收集，在数据变更的时候，set方法会让闭包中的Dep调用notify通知所有订阅者Watcher更新视图。
- [Vue事件机制](./vue-src/src/core/instance/events.js)---Vue.js提供了四个api,分别是`$on`，`$once`，`$off`，`$emit`。
- - [Vue虚拟DOM](./vue-src/src/core/vdom/index.js)---虚拟DOM是将真实的DOM树抽象成一个JS对象构成的抽象树，用属性来描述真实的DOM特性。
---


