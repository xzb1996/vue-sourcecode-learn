/* @flow */
/**
 * 将整个DOM结构用innerHTML修改到页面上，进行重绘视图层是相当消耗性能的。
 * Vue.js将DOM抽象成一个以JS对象为节点的虚拟DOM树，以VNode节点模拟真实DOM，
 * 对这个抽象树进行创建节点，删除节点及修改节点等操作。
 * 只需要对差异部分修改，大大提升新能，通过diff 算法得到最小单位，再将这个
 * 最小单位的视图进行更新。这样做减少了很多不需要的DOM操作，大大提高了性能。
 * 
 */
export default class VNode {
  // 当前节点标签名
  tag: string | void;
  // 当前节点对应对象，包含了具体的一些数据信息，是一个VNodeData类型
  data: VNodeData | void;
  // 子节点，是一个数组
  children: ?Array<VNode>;
  // 当前节点的文本
  text: string | void;
  // 当前虚拟节点对应的真实dom节点
  elm: Node | void;
  // 当前节点的名字控件
  ns: string | void;
  // 编译作用域
  context: Component | void; // rendered in this component's scope
  // 节点的key属性，被当做节点的标志，用以优化
  key: string | number | void;
  // 组件的option选项
  componentOptions: VNodeComponentOptions | void;
  // 当前节点对应的组件实例
  componentInstance: Component | void; // component instance
  // 当前节点的父节点
  parent: VNode | void; // component placeholder node

  // strictly internal
  // 是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false
  raw: boolean; // contains raw HTML? (server only)
  // 静态节点标志
  isStatic: boolean; // hoisted static node
  // 是否作为根节点插入
  isRootInsert: boolean; // necessary for enter transition check
  // 是否为注释节点
  isComment: boolean; // empty comment placeholder?
  // 是否为克隆节点
  isCloned: boolean; // is a cloned node?
  // 是否有v-once指令
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
