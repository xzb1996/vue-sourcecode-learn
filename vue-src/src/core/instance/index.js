import { initMixin } from './init'
import { stateMixin } from './state' // 初始化data，props，methods，computed，watch
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue(options) {
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 调用_init函数进行初始化
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
renderMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)

export default Vue
