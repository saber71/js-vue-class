import { debounce, throttle } from "@heraclius/js-tools"
import EventEmitter from "eventemitter3"
import { onMounted } from "vue"
import { VueDecorator } from "./decorators.ts"

/**
 * 生成一个用于监听事件的装饰器。
 * @param eventTarget 事件的目标对象，比如window或者document，也可以是EventEmitter对象，或是dom的类名。
 * @param eventName 要监听的事件名称，必须是WindowEventMap中定义的事件名。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。target是应用装饰器的对象，arg是装饰的方法。
 */
export function EventListener<Events extends EventEmitter.ValidEventTypes>(
  eventTarget: EventTarget | EventEmitter<Events> | string,
  eventName: keyof WindowEventMap | keyof Events
) {
  return VueDecorator({
    onSetup(instance, target, option) {
      if (typeof target === "function") {
        const fn = target.bind(instance)
        instance[option.decoratedName] = fn
        if (typeof eventTarget === "string") {
          const className = eventTarget
          onMounted(() => {
            const array = document.getElementsByClassName(className) as any
            for (let el of array) {
              el.addEventListener(eventName, fn)
            }
          })
        } else if (eventTarget instanceof EventEmitter) eventTarget.on(eventName as any, fn)
        else eventTarget.addEventListener(eventName as any, fn)
      } else throw new Error("EventListener target must be a function")
    },
    onUnmount(_, target) {
      if (typeof eventTarget === "string") {
        const array = document.getElementsByClassName(eventTarget) as any
        for (let el of array) {
          el.removeEventListener(eventName, target)
        }
      } else if (eventTarget instanceof EventEmitter) eventTarget.off(eventName as any, target)
      else eventTarget.removeEventListener(eventName as any, target)
    }
  })
}

/**
 * Throttle装饰器：为方法添加节流逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */
export function Throttle(delay?: number) {
  return VueDecorator({
    onSetup(instance, target, option) {
      if (typeof target === "function") {
        instance[option.decoratedName] = throttle(target.bind(instance), delay ?? 300)
      } else throw new Error("Throttle target must be a function")
    }
  })
}

/**
 * Debounce装饰器：为方法添加防抖逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */
export function Debounce(delay?: number) {
  return VueDecorator({
    onSetup(instance, target, option) {
      if (typeof target === "function") {
        instance[option.decoratedName] = debounce(target.bind(instance), delay ?? 300)
      } else throw new Error("Debounce target must be a function")
    }
  })
}

/**
 * 为属性装饰器，用于标记属性为可被一次性使用（Disposable）的。
 * @param methodName 可选参数，指定方法名。如果指定了方法名，则该属性会被视为一个方法，并且该方法会被标记为可被一次性使用。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记。
 */
export function Disposable(methodName: string = "dispose") {
  return VueDecorator({
    onUnmount(_, target) {
      if (typeof target === "object") {
        target[methodName]?.()
      }
    }
  })
}

/**
 * 一个用于绑定当前上下文到某个方法上的装饰器工厂函数。
 * 当这个装饰器被应用于方法上时，它会将该方法的上下文（this）与特定的参数绑定起来，
 * 以便于在不同的调用环境中能够保持方法的上下文一致性。
 */
export function BindThis(thisTarget?: any) {
  return VueDecorator({
    onSetup(instance, target, option) {
      if (typeof target === "function") {
        instance[option.decoratedName] = target.bind(thisTarget ?? instance)
      } else throw new Error("BindThis target must be a function")
    }
  })
}

/**
 * 被装饰的方法将在实例初始化时执行
 */
export function Setup() {
  return VueDecorator({
    onSetup(_, target) {
      if (typeof target === "function") {
        target()
      } else throw new Error("Setup target must be a function")
    }
  })
}
