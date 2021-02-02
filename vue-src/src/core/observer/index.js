/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// Observer为数据加上响应式属性进行双向绑定。如果是对象则进行深度遍历，为每个子对象都绑定上方法，如果是数组则为每一个成员都绑定上方法。
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 将Observer实例绑定到value数据的__ob__属性上
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 如果是数组，将修改后可以接货相应的数组方法替换掉该数组的原型中的原生方法，达到监听数组数据变化相应的效果。
      if (hasProto) {
        // 如果当前浏览器支持__proto__属性，则直接覆盖当前数组对象原型上单原生数组方法
        protoAugment(value, arrayMethods)
      } else {
        // 如果不支持，则直接覆盖数组对象的原型
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 如果是数组，则需要遍历数组中的每一个成员对其调用observe方法
      this.observeArray(value)
    } else {
      // 如果是对象，则直接调用walk方法进行双向绑定
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    // Object.keys() 方法会返回一个由一个给定对象的自身可枚举属性组成的数组，
    // 数组中属性名的排列顺序和正常循环遍历该对象时返回的顺序一致 。
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 遍历对象的每一个属性，调用defineReactive方法进行数据绑定
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      // 遍历数组中的成员，对每个成员调用observe方法进行检测
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
// observe(data, true /* asRootData */) 监视data属性
// vue的响应式数据会有一个__ob__的属性作为标记，里边存放了该属性的观察器（Observer实例），防止重复绑定。
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // instanceof 运算符用来测试一个对象在其原型链中是否存在一个构造函数的 prototype 属性
  // 判断value是否是对象或者是一个虚拟节点
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // hasOwn() 判断对象是否具有指定属性
  // 判断value是否有__ob__属性，并且value.__ob__的原型链上是否有Observer实例
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 如果有Observer实例，则将该实例返给ob
    ob = value.__ob__
  } else if (
    // 若没有该实例，则创建一个Observer实例并赋值给__ob__这个属性
    // 这里的判断是为了保证value是纯对象，而不是函数或者Regexp等情况
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 创建Observer实例
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // 如果是根组件则将vmCount加一
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
// 通过Object.defineProperty为数据定义上getter/setter方法
// 出发setter改变数据的时候就会通过Deps订阅者通知所有的Watcher观察者对象进行试图的更新
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 在闭包中定义了一个dep对象
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 如果之前对象已经预设了getter以及setter函数则将其取出来，新定义的getter/setter中会将其执行，保证不会覆盖之前已经定义的getter和setter
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 对象的子对象遍历进行observe并返回子节点的Observer对象
  let childOb = !shallow && observe(val)
  // Object.defineProperty---直接在一个对象上定义一个新属性，或者修改一个已经存在的属性
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 判断原对象是否拥有getter，若拥有则执行
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        // 进行依赖收集
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 判断是否是数组，若是则对每个成员进行依赖收集，如果数组的成员还是数组则递归
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      // 通过getter方法获取当前值
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        // 与新值进行比较，一致则不需要执行下面的操作
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 对新值进行observe，保证数据响应式
      childOb = !shallow && observe(newVal)
      // dep对象通知所有的观察者
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
// vm.$set分析
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 对target进行判断，是否是undefinded或者null或是原始类型值，那么在非生产环境下会打印警告信息
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }

  // target 为数组的情况
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 修改数组的长度，避免索引>数组长度导致splice方法执行有误
    target.length = Math.max(target.length, key)
    // 利用数组的splice变异方法触发响应式
    target.splice(key, 1, val)
    return val
  }

  // target 为对象的情况
  // 判断添加的的key不能为Object上的属性，并且key为target中的属性
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  // 以上都不成立，给target创建新的属性
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // target 本身不是响应式数据，直接赋值，进行响应式处理
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
