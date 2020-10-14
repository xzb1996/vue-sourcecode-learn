/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */
/**
 * 如果修改一个数组的成员，该成员是个对象，那么只需要递归对数组成员进行双向绑定即可。
 * 这时候有个问题：我们进行了pop，push等操作，push进去的对象是没有进行过双向绑定的，那我们如果监听数组的这些变化呢？
 * Vue.js提供的方法使重写push、pop、shift、unshift、sort、reverse这7个数组方法。
 */

import { def } from '../util/index'

// 获取原生数组的原型
const arrayProto = Array.prototype
// 创建一个新的数组对象，修改该对象上的数组的7个方法，防止污染原生数组方法
export const arrayMethods = Object.create(arrayProto)

// 重写以下数组方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 存储数组的原生方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 调用原生的数组方法
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 若有新插入的元素，需要将新元素重新进行observe才能响应式
    if (inserted) ob.observeArray(inserted)
    // notify change
    // dep通知所有注册的观察者进行响应式处理
    ob.dep.notify()
    return result
  })
})
