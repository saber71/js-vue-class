import { getDecoratedName, Injectable } from "@heraclius/injectify"
import { type Class } from "@heraclius/js-tools"
import { type WatchOptions } from "vue"
import type { RouteLocationNormalized } from "vue-router"
import { ModuleName } from "./constants"
import { applyMetadata, type ComponentOption, type CustomDecoratorOption, getOrCreateMetadata } from "./metadata"
import type { VueComponentClass } from "./types"
import { VueComponent, type VueComponentBaseProps } from "./vue-component"
import type { VueDirective } from "./vue-directive"
import type { VueRouterGuard } from "./vue-router-guard"
import type { VueService } from "./vue-service"

export type WatcherTarget<T extends VueService> = string | keyof T | ((instance: T) => any)

export type HookType =
  | "onMounted"
  | "onUpdated"
  | "onUnmounted"
  | "onBeforeMount"
  | "onBeforeUnmount"
  | "onErrorCaptured"
  | "onRenderTracked"
  | "onRenderTriggered"
  | "onActivated"
  | "onDeactivated"
  | "onServerPrefetch"
  | "onBeforeRouteUpdate"
  | "onBeforeRouteLeave"

/*
 * 用于为类装饰器创建Vue组件
 * @param Props 组件属性类型，继承自VueComponentBaseProps
 * @param option 可选的组件配置选项
 * @returns 返回一个函数，该函数接收类和可选的类装饰器上下文作为参数，并对类进行处理，标记为Vue组件并应用组件配置选项
 */
export function Component<Props extends VueComponentBaseProps>(option?: ComponentOption) {
  // 创建一个注入函数，配置模块名
  const fn = Injectable({ moduleName: ModuleName })
  // 返回一个类装饰器
  return (clazz: VueComponentClass<Props>, ctx?: ClassDecoratorContext) => {
    // 应用注入函数
    fn(clazz, ctx)
    // 获取或创建类的元数据
    const metadata = getOrCreateMetadata(clazz, ctx)
    // 标记元数据为组件，并附加组件配置选项
    metadata.isComponent = true
    metadata.componentOption = option
  }
}

/*
 * 用于为类装饰器提供服务注册功能。
 * @param option 可选参数，为@Injectable装饰器的参数。
 * @returns 返回一个函数，该函数接受类和上下文作为参数，并对其进行服务注册处理。
 */
export function Service(option?: Parameters<typeof Injectable>[0]) {
  // 创建一个 Injectable 装饰器函数，配置默认的模块名、单例模式和创建时的元数据处理。
  const fn = Injectable(
    Object.assign(
      {
        moduleName: ModuleName, // 默认模块名
        singleton: true, // 默认为单例模式
        onCreate: (instance: object) => applyMetadata(instance.constructor, instance), // 创建实例时应用元数据
        createImmediately: true
      },
      option // 合并用户自定义的配置
    )
  )

  // 返回一个处理函数，用于在类上应用服务注册。
  return (clazz: Class, ctx?: any) => {
    fn(clazz, ctx) // 调用@Injectable装饰器函数进行基础注册。
    getOrCreateMetadata(clazz, ctx).isService = true // 标记该类为服务。
  }
}

/*
 * 为类装饰器创建路由守卫
 * @param option 可选参数对象，用于配置路由守卫的行为
 * @param option.matchTo 可以是一个正则表达式或者一个函数，用于匹配目标路径
 * @param option.matchFrom 可以是一个正则表达式或者一个函数，用于匹配起始路径
 * @returns 返回一个函数，该函数接受类和上下文作为参数，用于注册和标记路由守卫类
 */
export function RouterGuard(option?: {
  matchTo?: RegExp | ((path: RouteLocationNormalized) => boolean)
  matchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean)
}) {
  // 使用Injectable装饰器创建一个单例模块，并在创建时应用元数据
  const fn = Injectable(
    Object.assign(
      {
        moduleName: ModuleName,
        singleton: true,
        onCreate: (instance: object) => applyMetadata(instance.constructor, instance)
      },
      option
    )
  )

  // 返回一个类装饰器函数
  return (clazz: Class<VueRouterGuard>, ctx?: any) => {
    fn(clazz, ctx) // 应用Injectable装饰器
    const metadata = getOrCreateMetadata(clazz, ctx) // 获取或创建类的元数据
    metadata.isRouterGuard = true // 标记类为路由守卫
    metadata.routerGuardMatchTo = option?.matchTo // 设置匹配目标路径的规则
    metadata.routerGuardMatchFrom = option?.matchFrom // 设置匹配起始路径的规则
  }
}

/**
 * 创建一个指令装饰器。
 * @param name 指令的名称。可选参数，如果未提供，则会根据类名自动推断。
 * @returns 返回一个函数，该函数接收一个类和可选的上下文参数，并对类进行处理，将其标记为指令。
 */
export function Directive(name?: string) {
  // 创建一个可注入的函数，该函数将类和上下文标记为模块的一部分
  const fn = Injectable({ moduleName: ModuleName })
  return (clazz: Class<VueDirective>, ctx?: any) => {
    // 使用注入函数处理类和上下文
    fn(clazz, ctx)
    // 获取或创建类的元数据
    const metadata = getOrCreateMetadata(clazz, ctx)
    // 标记元数据为指令
    metadata.isDirective = true
    // 如果没有提供指令名，则根据类名自动推断
    if (!name) {
      name = clazz.name.replace(/Directive$/, "")
      name = name[0].toLowerCase() + name.slice(1)
    }
    // 设置指令名
    metadata.directiveName = name
  }
}

/**
 * 为属性装饰器，用于标记属性为可变（Mutable）的。
 * @param shallow 可选参数，指定是否进行浅层变异。如果为true，则只对直接属性进行变异；否则，对所有嵌套属性进行深度变异。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记，表示它们可以在运行时被修改。
 */
export function Mut(shallow?: boolean) {
  return (target: object, arg: any) => {
    const metadata = getOrCreateMetadata(target, arg)
    metadata.mutts.push({ propName: getName(arg), shallow })
  }
}

/**
 * 定义一个用于创建只读属性的装饰器函数。
 * @param shallow 如果为true，则只对属性的直接值应用只读约束，而不考虑其嵌套属性。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名，用于应用只读约束。
 */
export function Readonly(shallow?: boolean) {
  return (target: object, arg: any) => {
    // 获取或创建目标对象的元数据，并记录要设置为只读的属性信息
    const metadata = getOrCreateMetadata(target, arg)
    metadata.readonlys.push({ propName: getName(arg), shallow })
  }
}

/*
 * 为Vue组件的属性创建链接
 * @param option 可选参数对象，包含以下属性：
 *   - refName?: string 引用名称
 *   - isDirective?: boolean 是否为指令
 *   - directiveName?: string 指令名称
 * @returns 返回一个函数，该函数接收两个参数：target（Vue组件）和arg（属性标识符），并执行链接的创建逻辑
 */
export function Link(option?: { refName?: string; isDirective?: boolean; directiveName?: string }) {
  return (target: VueComponent, arg: any) => {
    // 获取或创建元数据，并添加一个新的链接到links数组
    getOrCreateMetadata(target, arg).links.push({
      propName: getName(arg), // 获取属性名
      refName: option?.refName, // 引用名称，如果提供
      isDirective: !!(option?.isDirective || option?.directiveName), // 判断是否为指令，或者指令名称已提供
      directiveName: option?.directiveName // 指令名称，如果提供
    })
  }
}

/*
 * 用于在Vue组件中注入属性的装饰器
 * @param key 可选参数，指定属性的键名或键符号
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，用于装饰属性
 */
export function VueInject(key?: string | symbol) {
  return (target: object, arg: any) => {
    // 如果没有提供key，则尝试从目标对象的属性上获取元数据
    if (!key) key = (Reflect as any).getMetadata("design:type", target, arg)?.name
    // 创建或获取目标对象的元数据，并记录注入的属性信息
    getOrCreateMetadata(target, arg).vueInject.push({
      propName: getName(arg),
      provideKey: key
    })
  }
}

/*
 * 定义一个用于创建计算属性的装饰器，适用于方法和getter。
 * 初始时，会被调用两次以处理getter。
 *
 * @param target 目标对象，即应用装饰器的对象。
 * @param arg 装饰器的参数，通常是属性名。
 * @returns 返回一个函数，该函数用于向目标对象的指定属性添加计算属性信息。
 */
export function Computed() {
  return (target: any, arg: any) => {
    // 向目标对象的属性添加计算属性信息
    getOrCreateMetadata(target, arg).computers.push(getName(arg))
  }
}

/**
 * 定义一个Hook装饰器函数，用于在目标对象的方法上注册hook信息。
 * @param type Hook的类型，指示这个装饰器是用来注册哪种类型的hook。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和方法名。
 *          通过这个函数，将hook信息保存到元数据中。
 */
export function Hook(type: HookType) {
  return (target: object, arg: any) => {
    // 获取或创建元数据，并将新的hook信息添加到hooks数组中
    getOrCreateMetadata(target, arg).hooks.push({
      methodName: getName(arg), // 获取方法名
      type // 注册的hook类型
    })
  }
}

/**
 * PropsWatcher 是一个用于装饰器的方法，用于监视对象属性的变化。
 * @param option 可选参数，提供给 WatchOptions 的配置项。
 * @returns 返回一个函数，该函数接收两个参数：target 和 arg，
 *          其中 target 表示目标对象，arg 表示属性名。
 *          该函数会将属性变化的监视配置添加到目标对象的元数据中。
 */
export function PropsWatcher(option?: WatchOptions) {
  return (target: object, arg: string) => {
    // 为指定目标对象的属性创建或获取监视配置，并添加到元数据中
    getOrCreateMetadata(target, arg).propsWatchers.push({
      methodName: getName(arg), // 获取属性名
      option // 添加传入的配置选项
    })
  }
}

/**
 * 创建一个监视器函数，用于监视Vue服务的某些变化。
 * @param option 配置对象，可选。包含source和option属性。
 * @param option.source 可以是一个监视目标或者监视目标数组。
 * @param option.option 观察选项，提供额外的配置。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。
 *          函数会将watcher信息存储到target和arg指定的元数据中。
 */
export function Watcher<T extends VueService>(option?: {
  source?: WatcherTarget<T> | WatcherTarget<T>[]
  option?: WatchOptions
}) {
  return (target: object, arg: any) => {
    // 获取或创建目标对象和参数的元数据，并将新的watcher信息添加到watchers数组中
    getOrCreateMetadata(target, arg).watchers.push({
      methodName: getName(arg), // 获取方法名
      ...option // 扩展传入的配置选项
    })
  }
}

export function VueDecorator(option: Omit<CustomDecoratorOption, "decoratedName">) {
  return (target: any, arg: any) => {
    getOrCreateMetadata(target, arg).vueDecorators.push({
      ...option,
      decoratedName: getDecoratedName(arg) as any
    })
  }
}

/**
 * 获取名称 - 根据输入参数的类型返回相应的名称
 * @param arg 可以是一个字符串或者一个包含名称属性的对象
 * @returns 返回一个字符串，表示输入参数的名称
 */
function getName(arg: string | { name: string }) {
  // 如果arg是字符串类型，则直接返回该字符串
  if (typeof arg === "string") return arg
  // 如果arg是对象类型，则返回对象的name属性
  return arg.name
}
