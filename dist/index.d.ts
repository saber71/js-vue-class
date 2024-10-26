import { App } from 'vue';
import { Class } from '@heraclius/js-tools';
import { ComponentCustomProps } from 'vue';
import { ComponentPublicInstance } from 'vue';
import { default as default_2 } from 'eventemitter3';
import { DefineSetupFnComponent } from 'vue';
import { DirectiveBinding } from 'vue';
import { EmitsOptions } from 'vue';
import { EmitsToProps } from 'vue';
import { getCurrentInstance } from 'vue';
import { HTMLAttributes } from 'vue';
import { Injectable } from '@heraclius/injectify';
import { LoadableContainer } from '@heraclius/injectify';
import { NavigationGuardNext } from 'vue-router';
import { Prop } from 'vue';
import { PublicProps } from 'vue';
import { RouteLocationNormalized } from 'vue-router';
import { RouteLocationNormalizedLoaded } from 'vue-router';
import { RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { Router } from 'vue-router';
import { SetupContext } from 'vue';
import { Slot } from 'vue';
import { StyleValue } from 'vue';
import { VNodeChild } from 'vue';
import { VNodeProps } from 'vue';
import { WatchOptions } from 'vue';

export declare type AllowedComponentProps = {
    class?: any;
    style?: StyleValue;
    [name: string]: any;
};

/**
 * 一个用于绑定当前上下文到某个方法上的装饰器工厂函数。
 * 当这个装饰器被应用于方法上时，它会将该方法的上下文（this）与特定的参数绑定起来，
 * 以便于在不同的调用环境中能够保持方法的上下文一致性。
 */
export declare function BindThis(thisTarget?: any): (target: any, arg: any) => void;

export declare function Component<Props extends VueComponentBaseProps>(option?: ComponentOption): (clazz: VueComponentClass<Props>, ctx?: ClassDecoratorContext) => void;

declare interface ComponentOption {
    provideThis?: string | boolean;
}

export declare type ComponentProps<T extends {}> = ComponentPropsObject<T> | Array<KeysOfUnion<DistributiveOmit<T, "slots">>>;

export declare type ComponentPropsObject<T extends {}> = {
    [U in KeysOfUnion<DistributiveOmit<T, "slots">>]-?: Prop<any>;
};

export declare type ComponentSlots<T extends {
    props: any;
}> = NonNullable<T["props"]["v-slots"]>;

export declare function Computed(): (target: any, arg: any) => void;

declare interface CustomDecoratorOption {
    decoratedName: string;
    onSetup?: (instance: any, target: any, option: CustomDecoratorOption, metadata: VueClassMetadata) => void;
    onUnmount?: (instance: any, target: any, option: CustomDecoratorOption, metadata: VueClassMetadata) => void;
}

/**
 * Debounce装饰器：为方法添加防抖逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */
export declare function Debounce(delay?: number): (target: any, arg: any) => void;

declare type DefaultSlots = {
    default(): VNodeChild;
};

export declare type DefineEmits<Emit extends EmitsOptions> = Array<keyof Emit>;

/**
 * 创建一个指令装饰器。
 * @param name 指令的名称。可选参数，如果未提供，则会根据类名自动推断。
 * @returns 返回一个函数，该函数接收一个类和可选的上下文参数，并对类进行处理，将其标记为指令。
 */
export declare function Directive(name?: string): (clazz: Class<VueDirective>, ctx?: any) => void;

/**
 * 为属性装饰器，用于标记属性为可被一次性使用（Disposable）的。
 * @param methodName 可选参数，指定方法名。如果指定了方法名，则该属性会被视为一个方法，并且该方法会被标记为可被一次性使用。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记。
 */
declare function Disposable_2(methodName?: string): (target: any, arg: any) => void;
export { Disposable_2 as Disposable }

export declare type DistributiveOmit<T, K extends keyof any> = T extends T ? Omit<T, K> : never;

declare type DistributiveVModel<T extends {}> = T extends T ? WithVModel<T> : never;

declare type DistributiveVSlots<T extends {}> = T extends T ? WithVSlots<T> : never;

/**
 * 生成一个用于监听事件的装饰器。
 * @param eventTarget 事件的目标对象，比如window或者document，也可以是EventEmitter对象，或是dom的类名。
 * @param eventName 要监听的事件名称，必须是WindowEventMap中定义的事件名。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。target是应用装饰器的对象，arg是装饰的方法。
 */
declare function EventListener_2<Events extends default_2.ValidEventTypes>(eventTarget: EventTarget | default_2<Events> | string, eventName: keyof WindowEventMap | keyof Events): (target: any, arg: any) => void;
export { EventListener_2 as EventListener }

/**
 * 定义一个Hook装饰器函数，用于在目标对象的方法上注册hook信息。
 * @param type Hook的类型，指示这个装饰器是用来注册哪种类型的hook。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和方法名。
 *          通过这个函数，将hook信息保存到元数据中。
 */
export declare function Hook(type: HookType): (target: object, arg: any) => void;

export declare type HookType = "onMounted" | "onUpdated" | "onUnmounted" | "onBeforeMount" | "onBeforeUnmount" | "onErrorCaptured" | "onRenderTracked" | "onRenderTriggered" | "onActivated" | "onDeactivated" | "onServerPrefetch" | "onBeforeRouteUpdate" | "onBeforeRouteLeave";

declare type KeysOfUnion<T> = T extends T ? keyof T : never;

export declare function Link(option?: {
    refName?: string;
    isDirective?: boolean;
    directiveName?: string;
}): (target: VueComponent, arg: any) => void;

declare type MixDefaultSlots<T extends {}> = "default" extends keyof T ? {} : DefaultSlots;

declare type ModelProps<T extends {}> = Exclude<{
    [Prop in keyof T]: T extends {
        [k in Prop as `onUpdate:${k & string}`]?: any;
    } ? Prop : never;
}[keyof T], undefined>;

export declare const ModuleName = "vue-class";

/**
 * 为属性装饰器，用于标记属性为可变（Mutable）的。
 * @param shallow 可选参数，指定是否进行浅层变异。如果为true，则只对直接属性进行变异；否则，对所有嵌套属性进行深度变异。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记，表示它们可以在运行时被修改。
 */
export declare function Mut(shallow?: boolean): (target: object, arg: any) => void;

/**
 * PropsWatcher 是一个用于装饰器的方法，用于监视对象属性的变化。
 * @param option 可选参数，提供给 WatchOptions 的配置项。
 * @returns 返回一个函数，该函数接收两个参数：target 和 arg，
 *          其中 target 表示目标对象，arg 表示属性名。
 *          该函数会将属性变化的监视配置添加到目标对象的元数据中。
 */
export declare function PropsWatcher(option?: WatchOptions): (target: object, arg: string) => void;

/**
 * 定义一个用于创建只读属性的装饰器函数。
 * @param shallow 如果为true，则只对属性的直接值应用只读约束，而不考虑其嵌套属性。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名，用于应用只读约束。
 */
declare function Readonly_2(shallow?: boolean): (target: object, arg: any) => void;
export { Readonly_2 as Readonly }

export declare const ROUTER = "router";

export declare function RouterGuard(option?: {
    matchTo?: RegExp | ((path: RouteLocationNormalized) => boolean);
    matchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean);
}): (clazz: Class<VueRouterGuard>, ctx?: any) => void;

export declare function Service(option?: Parameters<typeof Injectable>[0]): (clazz: Class, ctx?: any) => void;

/**
 * 被装饰的方法将在实例初始化时执行
 */
export declare function Setup(): (target: any, arg: any) => void;

/**
 * Throttle装饰器：为方法添加节流逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */
export declare function Throttle(delay?: number): (target: any, arg: any) => void;

export declare function toNative<Props extends VueComponentBaseProps, Emit extends EmitsOptions = {}>(componentClass: VueComponentClass<Props, Emit>, genInstance?: () => VueComponent<Props, Emit>): DefineSetupFnComponent<Props, Emit, {}, Props & EmitsToProps<Emit>, PublicProps>;

export declare type TransformModelValue<T extends {}> = "v-model:modelValue" extends keyof T ? Omit<T, "v-model:modelValue"> & {
    ["v-model"]?: T["v-model:modelValue"];
} : T;

export declare class VueClass {
    private static readonly _dependencyInjection;
    static getContainer(): LoadableContainer;
    static getInstance<T>(clazz: Class<T>): T;
    static getValue<T>(label: string): T;
    static load(): void;
    static install(app: App, router?: Router): Promise<void>;
}

declare class VueClassMetadata {
    isComponent: boolean;
    componentOption?: ComponentOption;
    isService: boolean;
    isDirective: boolean;
    isRouterGuard: boolean;
    directiveName: string;
    routerGuardMatchTo?: RegExp | ((path: RouteLocationNormalized) => boolean);
    routerGuardMatchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean);
    readonly mutts: {
        propName: string;
        shallow?: boolean;
    }[];
    readonly readonlys: {
        propName: string;
        shallow?: boolean;
    }[];
    readonly links: {
        refName?: string;
        propName: string;
        isDirective?: boolean;
        directiveName?: string;
    }[];
    readonly vueInject: Array<{
        propName: string;
        provideKey: any;
    }>;
    readonly hooks: {
        methodName: string;
        type: HookType;
    }[];
    readonly watchers: {
        methodName: string;
        source?: WatcherTarget<any> | WatcherTarget<any>[];
        option?: WatchOptions;
    }[];
    readonly propsWatchers: {
        methodName: string;
        option?: WatchOptions;
    }[];
    readonly computers: string[];
    readonly vueDecorators: Array<CustomDecoratorOption>;
    handleCustomDecorators(instance: any): void;
    clone(): VueClassMetadata;
    handleComponentOption(instance: VueComponent): void;
    handleWatchers(instance: object): void;
    handlePropsWatchers(instance: VueComponent): void;
    handleHook(instance: VueComponent): void;
    handleVueInject(instance: any): void;
    handleMut(instance: object): void;
    handleReadonly(instance: object): void;
    handleLink(instance: VueComponent): void;
    handleComputer(instance: object): void;
}

export declare class VueComponent<Props extends VueComponentBaseProps = VueComponentBaseProps, Emit extends EmitsOptions = {}> extends VueService {
    static __test__: boolean;
    static readonly defineProps: ComponentProps<VueComponentBaseProps & any>;
    constructor();
    readonly vueInstance: NonNullable<ReturnType<typeof getCurrentInstance>>;
    readonly context: WithSlotTypes<Emit, Props>;
    readonly childInstMap: Record<string, VueComponent>;
    get props(): Props;
    get slot(): {
        [name: string]: Slot<any> | undefined;
    };
    render(): VNodeChild;
    onMounted(): void;
    onBeforeUnmounted(): void;
    onUnmounted(): void;
    getLinkElement(refName: string): HTMLElement;
    getLinkInst<Inst extends VueComponent = VueComponent>(name: string): Inst;
}

export declare interface VueComponentBaseProps extends Partial<HTMLAttributes> {
    inst?: string;
}

export declare type VueComponentClass<Props extends VueComponentBaseProps = VueComponentBaseProps, Emit extends EmitsOptions = {}> = {
    new (...args: any[]): VueComponent<Props>;
    defineProps: ComponentProps<Props>;
};

export declare type VueComponentProps<T extends {}> = DistributiveOmit<T, "slots"> & DistributiveVModel<T> & DistributiveVSlots<T> & VNodeProps & AllowedComponentProps & ComponentCustomProps;

export declare function VueDecorator(option: Omit<CustomDecoratorOption, "decoratedName">): (target: any, arg: any) => void;

export declare class VueDirective<El extends HTMLElement | ComponentPublicInstance = HTMLElement, Value = any> {
    readonly el: El;
    readonly name: string;
    private static readonly _elMapVueDirective;
    private static readonly _directiveNameMapVueDirective;
    static install(app: App): void;
    static getInstance<T extends VueDirective>(el: any, directiveName: string, clazz?: Class<T>): T;
    constructor(el: El, name: string);
    mountedAndUpdated(binding: DirectiveBinding<Value>): void;
    created(binding: DirectiveBinding<Value>): void;
    beforeMount(binding: DirectiveBinding<Value>): void;
    mounted(binding: DirectiveBinding<Value>): void;
    beforeUpdate(binding: DirectiveBinding<Value>): void;
    updated(binding: DirectiveBinding<Value>): void;
    beforeUnmount(binding: DirectiveBinding<Value>): void;
    unmounted(binding: DirectiveBinding<Value>): void;
}

export declare function VueInject(key?: string | symbol): (target: object, arg: any) => void;

export declare class VueRouterGuard {
    static install(router: Router): void;
    beforeEach(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext): void;
    beforeResolve(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext): void;
    afterEach(to: RouteLocationNormalized, from: RouteLocationNormalized): void;
    onError(error: Error, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded): void;
}

export declare class VueService {
    get router(): Router;
    get route(): RouteLocationNormalizedLoadedGeneric;
    setup(): void;
    reset(): void;
}

/**
 * 创建一个监视器函数，用于监视Vue服务的某些变化。
 * @param option 配置对象，可选。包含source和option属性。
 * @param option.source 可以是一个监视目标或者监视目标数组。
 * @param option.option 观察选项，提供额外的配置。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。
 *          函数会将watcher信息存储到target和arg指定的元数据中。
 */
export declare function Watcher<T extends VueService>(option?: {
    source?: WatcherTarget<T> | WatcherTarget<T>[];
    option?: WatchOptions;
}): (target: object, arg: any) => void;

export declare type WatcherTarget<T extends VueService> = string | keyof T | ((instance: T) => any);

export declare type WithSlotTypes<Emit extends EmitsOptions, T extends {}> = Omit<SetupContext<Emit>, "slots"> & {
    slots: NonNullable<VueComponentProps<T>["v-slots"]>;
};

export declare type WithVModel<T extends {}, U extends keyof T = ModelProps<T>> = TransformModelValue<{
    [k in U as `v-model:${k & string}`]?: T[k] | [T[k], string[]];
}>;

export declare type WithVSlots<T extends Record<string, any>> = {
    "v-slots"?: "slots" extends keyof T ? Partial<T["slots"] & {
        $stable: boolean;
    } & MixDefaultSlots<T["slots"]>> : Partial<{
        $stable: boolean;
        default(): VNodeChild;
    }>;
};

export { }
