/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'


// Vue.js提供了四个api，分别是$on,$once,$off,$emit
// 初始化事件
export function initEvents (vm: Component) {
  // 在vm上创建一个_events对象用来存放事件
  vm._events = Object.create(null)
  // _hasHookEvent是标志位，用来表明是否存在钩子，而不需要通过哈希表的方法来查找
  // 是否有钩子，可以减少不必要的开销，优化性能
  vm._hasHookEvent = false
  // init parent attached events
  // 初始化父组件attach的事件
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: any

function add (event, fn) {
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  // $on方法用来在vm实例上监听一个自定义事件，该事件可用$emit触发
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) {
      // 如果事件是个数组，则递归$on方法，给每个成员都绑定上方法
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      // 这里在注册事件的时候通过标志位来表明存在钩子，而不需要通过哈希表的方法
      // 来查找是否有钩子，这样做可以减少不必要的开销，优化性能
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  // $once监听一个只能触发一次的事件，在触发以后自动移除该事件
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      // 在第一次执行的时候将该事件销毁
      vm.$off(event, on)
      // 执行注册的方法
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  // 用来移除一个自定义事件
  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    // 如果没有传参数，则销毁所有事件
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }

    // array of events
    // 如果event是个数组，则遍历数组，销毁数组中的事件
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }

    // specific event
    // 若不存在该事件，则直接返回
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    // 若同时还传递了函数，将当前event方法下的所有方法销毁
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    // 遍历找到该方法并删除
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  // $emit 用来触发指定的自定义事件
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    // 若_events中存在event事件
    let cbs = vm._events[event]
    if (cbs) {
      // 将类数组的对象转换为数组
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      // 遍历执行
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
