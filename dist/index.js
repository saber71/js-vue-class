import { LoadableContainer, Injectable, getDecoratedName } from '@heraclius/injectify';
import { isBrowser, deepClone, throttle, debounce } from '@heraclius/js-tools';
import { getCurrentInstance, defineComponent, onMounted, onBeforeUnmount, onUnmounted, inject, provide, watchEffect, watch, onServerPrefetch, onRenderTriggered, onRenderTracked, onErrorCaptured, onDeactivated, onActivated, onUpdated, onBeforeMount, shallowRef, ref, shallowReadonly, readonly, computed } from 'vue';
import { onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router';
import EventEmitter from 'eventemitter3';

const ModuleName = "vue-class";
const ROUTER = "router";

class VueDirective {
    el;
    name;
    static _elMapVueDirective = new Map();
    static _directiveNameMapVueDirective = new Map();
    static install(app) {
        const directives = getAllMetadata().filter((item)=>item[1].isDirective).map((item)=>[
                item[1].directiveName,
                item
            ]);
        VueDirective._directiveNameMapVueDirective = new Map(directives);
        for (let directive of directives){
            const directiveName = directive[1][1].directiveName;
            const clazz = directive[1][0];
            app.directive(directiveName, {
                created (el, binding) {
                    VueDirective.getInstance(el, directiveName, clazz).created(binding);
                },
                mounted (el, binding) {
                    const directive = VueDirective.getInstance(el, directiveName, clazz);
                    directive.mounted(binding);
                    directive.mountedAndUpdated(binding);
                },
                updated (el, binding) {
                    const directive = VueDirective.getInstance(el, directiveName, clazz);
                    directive.updated(binding);
                    directive.mountedAndUpdated(binding);
                },
                beforeUnmount (el, binding) {
                    VueDirective.getInstance(el, directiveName, clazz).beforeUnmount(binding);
                },
                beforeUpdate (el, binding) {
                    VueDirective.getInstance(el, directiveName, clazz).beforeUpdate(binding);
                },
                beforeMount (el, binding) {
                    VueDirective.getInstance(el, directiveName, clazz).beforeMount(binding);
                },
                unmounted (el, binding) {
                    VueDirective.getInstance(el, directiveName, clazz).unmounted(binding);
                }
            });
        }
    }
    static getInstance(el, directiveName, clazz) {
        if (!clazz) {
            clazz = this._directiveNameMapVueDirective.get(directiveName);
            if (!clazz) throw new Error("Unable to find the VueDirective class corresponding to the directive name");
        }
        let map = this._elMapVueDirective.get(el);
        if (!map) this._elMapVueDirective.set(el, map = new Map());
        let instance = map.get(directiveName);
        if (!instance) map.set(directiveName, instance = new clazz(el, directiveName));
        return instance;
    }
    constructor(el, name){
        this.el = el;
        this.name = name;
    }
    mountedAndUpdated(binding) {}
    created(binding) {}
    beforeMount(binding) {}
    mounted(binding) {}
    beforeUpdate(binding) {}
    updated(binding) {}
    beforeUnmount(binding) {}
    unmounted(binding) {
        const map = VueDirective._elMapVueDirective.get(this.el);
        if (map) {
            map.delete(this.name);
            if (!map.size) VueDirective._elMapVueDirective.delete(this.el);
        }
    }
}

class VueRouterGuard {
    static install(router) {
        const guards = getAllMetadata().filter((item)=>item[1].isRouterGuard);
        for (let guard of guards){
            const guardInstance = VueClass.getInstance(guard[0]);
            const metadata = guard[1];
            const beforeEach = guardInstance.beforeEach.bind(guardInstance);
            const afterEach = guardInstance.afterEach.bind(guardInstance);
            const beforeResolve = guardInstance.beforeResolve.bind(guardInstance);
            const onError = guardInstance.onError.bind(guardInstance);
            router.onError((error, to, from)=>{
                if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) onError(error, to, from);
            });
            router.beforeEach(async (to, from, next)=>{
                if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) await beforeEach(to, from, next);
                else next();
            });
            router.afterEach(async (to, from)=>{
                if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) await afterEach(to, from);
            });
            router.beforeResolve(async (to, from, next)=>{
                if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) await beforeResolve(to, from, next);
                else next();
            });
        }
        function match(to, from, matchTo, matchFrom) {
            if (!matchFrom && !matchTo) return true;
            else if (matchTo && matchFrom) return match(matchFrom, from) && match(matchTo, to);
            else return match(matchTo, to) || match(matchFrom, from);
            function match(item, path) {
                if (!item) return false;
                if (item instanceof RegExp) return item.test(path.path);
                return item(path);
            }
        }
    }
    beforeEach(to, from, next) {
        next();
    }
    beforeResolve(to, from, next) {
        next();
    }
    afterEach(to, from) {}
    onError(error, to, from) {}
}

class VueClass {
    static _dependencyInjection = new LoadableContainer();
    static getContainer() {
        return this._dependencyInjection;
    }
    static getInstance(clazz) {
        return this.getValue(clazz.name);
    }
    static getValue(label) {
        return this._dependencyInjection.getValue(label);
    }
    static load() {
        this._dependencyInjection.load({
            moduleName: ModuleName
        });
    }
    static async install(app, router) {
        this.load();
        VueDirective.install(app);
        if (router) {
            this._dependencyInjection.bindValue(ROUTER, router);
            VueRouterGuard.install(router);
        }
    }
}

class VueService {
    get router() {
        if (!isBrowser) throw new Error("router is not available in nodejs side");
        return VueClass.getValue(ROUTER);
    }
    get route() {
        return this.router.currentRoute.value;
    }
    setup() {}
    reset() {
        const initMut = this[initMutKey];
        if (initMut) {
            for(let key in initMut){
                this[key] = initMut[key];
            }
        }
    }
}

class VueComponent extends VueService {
    static __test__ = false;
    static defineProps = [
        "inst"
    ];
    constructor(){
        super();
        let curInstance = getCurrentInstance();
        if (!curInstance) {
            if (VueComponent.__test__) curInstance = {
                appContext: {}
            };
            else throw new Error("Cannot directly create VueComponent instance");
        }
        this.vueInstance = curInstance;
        this.context = curInstance.appContext;
    }
    vueInstance;
    context;
    childInstMap = {};
    get props() {
        return this.vueInstance.props;
    }
    get slot() {
        return this.vueInstance.slots ?? {};
    }
    render() {}
    onMounted() {}
    onBeforeUnmounted() {}
    onUnmounted() {}
    getLinkElement(refName) {
        return this.vueInstance.refs?.[refName];
    }
    getLinkInst(name) {
        return this.childInstMap[name];
    }
}
function toNative(componentClass, genInstance) {
    return defineComponent(()=>{
        const instance = genInstance ? genInstance() : VueClass.getInstance(componentClass);
        const metadata = applyMetadata(componentClass, instance);
        onMounted(instance.onMounted.bind(instance));
        onBeforeUnmount(instance.onBeforeUnmounted.bind(instance));
        onBeforeUnmount(()=>{
            for (let customDecorator of metadata.vueDecorators){
                customDecorator.onUnmount?.(instance, instance[customDecorator.decoratedName], customDecorator, metadata);
            }
        });
        onUnmounted(instance.onUnmounted.bind(instance));
        return instance.render.bind(instance);
    }, {
        name: componentClass.name,
        props: componentClass.defineProps
    });
}

const childInstMapKey = Symbol("childInstMap");
const initMutKey = Symbol("init-mut");
class VueClassMetadata {
    isComponent = false;
    componentOption;
    isService = false;
    isDirective = false;
    isRouterGuard = false;
    directiveName = "";
    routerGuardMatchTo;
    routerGuardMatchFrom;
    mutts = [];
    readonlys = [];
    links = [];
    vueInject = [];
    hooks = [];
    watchers = [];
    propsWatchers = [];
    computers = [];
    vueDecorators = [];
    handleCustomDecorators(instance) {
        for (let customDecorator of this.vueDecorators){
            customDecorator.onSetup?.(instance, instance[customDecorator.decoratedName], customDecorator, this);
        }
    }
    clone() {
        return deepClone(this);
    }
    handleComponentOption(instance) {
        if (instance.props.inst) {
            const instMap = inject(childInstMapKey);
            if (instMap) instMap[instance.props.inst] = instance;
        }
        provide(childInstMapKey, instance.childInstMap);
        if (this.componentOption) {
            const { provideThis } = this.componentOption;
            if (provideThis) {
                const key = typeof provideThis === "boolean" ? instance.constructor.name : provideThis;
                provide(key, instance);
            }
        }
    }
    handleWatchers(instance) {
        for (let metadata of this.watchers){
            let fn = instance[metadata.methodName];
            if (typeof fn !== "function") throw new Error("Decorator Watcher can only be used on methods");
            fn = fn.bind(instance);
            if (!metadata.source) watchEffect(fn, metadata.option);
            else {
                if (!(metadata.source instanceof Array)) metadata.source = [
                    metadata.source
                ];
                const source = metadata.source.map((item)=>{
                    if (typeof item === "string") {
                        const $ = instance[Symbol.for(item)];
                        return $ ?? (()=>instance[item]);
                    } else return ()=>item(instance);
                });
                watch(source, fn, metadata.option);
            }
        }
    }
    handlePropsWatchers(instance) {
        for (let data of this.propsWatchers){
            let fn = instance[data.methodName];
            if (typeof fn !== "function") throw new Error("Decorator PropsWatcher can only be used on methods");
            fn = fn.bind(instance);
            watch(instance.props, fn, data.option);
        }
    }
    handleHook(instance) {
        for (let hookData of this.hooks){
            let fn = instance[hookData.methodName];
            if (typeof fn !== "function") throw new Error("Decorator Hook can only be used for methods");
            fn = fn.bind(instance);
            switch(hookData.type){
                case "onMounted":
                    onMounted(fn);
                    break;
                case "onUnmounted":
                    onUnmounted(fn);
                    break;
                case "onBeforeMount":
                    onBeforeMount(fn);
                    break;
                case "onBeforeUnmount":
                    onBeforeUnmount(fn);
                    break;
                case "onUpdated":
                    onUpdated(fn);
                    break;
                case "onActivated":
                    onActivated(fn);
                    break;
                case "onDeactivated":
                    onDeactivated(fn);
                    break;
                case "onErrorCaptured":
                    onErrorCaptured(fn);
                    break;
                case "onRenderTracked":
                    onRenderTracked(fn);
                    break;
                case "onRenderTriggered":
                    onRenderTriggered(fn);
                    break;
                case "onServerPrefetch":
                    onServerPrefetch(fn);
                    break;
                case "onBeforeRouteLeave":
                    onBeforeRouteLeave(fn);
                    break;
                case "onBeforeRouteUpdate":
                    onBeforeRouteUpdate(fn);
                    break;
                default:
                    throw new Error("Unknown Hook Type " + hookData.type);
            }
        }
    }
    handleVueInject(instance) {
        for (let item of this.vueInject){
            const val = inject(item.provideKey);
            Object.defineProperty(instance, item.propName, {
                configurable: true,
                enumerable: true,
                get: ()=>val
            });
        }
    }
    handleMut(instance) {
        let initMut = instance[initMutKey];
        if (!initMut) initMut = instance[initMutKey] = {};
        for (let data of this.mutts){
            const value = instance[data.propName];
            initMut[data.propName] = deepClone(value);
            const ref$ = data.shallow ? shallowRef(value) : ref(value);
            instance[Symbol.for(data.propName)] = ref$;
            Object.defineProperty(instance, data.propName, {
                configurable: true,
                enumerable: true,
                set (v) {
                    ref$.value = v;
                },
                get () {
                    return ref$.value;
                }
            });
        }
    }
    handleReadonly(instance) {
        for (let data of this.readonlys){
            const value = instance[data.propName];
            const $ = data.shallow ? shallowReadonly(value) : readonly(value);
            instance[Symbol.for(data.propName)] = $;
            Object.defineProperty(instance, data.propName, {
                configurable: true,
                enumerable: true,
                get () {
                    return $;
                }
            });
        }
    }
    handleLink(instance) {
        for (let data of this.links){
            let refName = data.propName;
            let directiveName = "";
            if (data.refName) {
                refName = data.refName;
            } else if (data.isDirective) {
                refName = refName.replace(/Directive$/, "");
            }
            if (data.isDirective) {
                directiveName = data.directiveName ?? "";
                if (!directiveName) directiveName = refName;
            }
            Object.defineProperty(instance, data.propName, {
                configurable: true,
                enumerable: true,
                get () {
                    const el = instance.childInstMap[refName] ?? instance.vueInstance.refs?.[refName];
                    if (data.isDirective) {
                        if (!el) throw new Error("There is no ref named " + refName);
                        return VueDirective.getInstance(el, directiveName);
                    }
                    return el;
                }
            });
        }
    }
    handleComputer(instance) {
        if (!this.computers.length) return;
        const prototypeOf = Object.getPrototypeOf(instance);
        for (let computerName of this.computers){
            const target = instance[computerName];
            if (typeof target === "function") {
                const fn = target.bind(instance);
                const computer = computed(fn);
                instance[Symbol.for(computerName)] = computer;
                instance[computerName] = ()=>computer.value;
            } else {
                const getter = Object.getOwnPropertyDescriptor(prototypeOf, computerName)?.get;
                if (!getter) throw new Error("Computer can only be used on getters or no parameter methods");
                const computer = computed(()=>getter.call(instance));
                instance[Symbol.for(computerName)] = computer;
                Object.defineProperty(instance, computerName, {
                    configurable: true,
                    get: ()=>computer.value
                });
            }
        }
    }
}
const metadataMap = new Map();
function getAllMetadata() {
    return Array.from(metadataMap.entries());
}
function getMetadata(clazz) {
    const metadata = metadataMap.get(clazz);
    if (!metadata) throw new Error("Unable to find corresponding Metadata instance");
    return metadata;
}
const appliedSymbol = Symbol("__appliedMetadata__");
function applyMetadata(clazz, instance) {
    const metadata = getMetadata(clazz);
    if (instance[appliedSymbol]) return metadata;
    instance[appliedSymbol] = true;
    metadata.handleMut(instance);
    metadata.handleReadonly(instance);
    metadata.handleVueInject(instance);
    metadata.handleComputer(instance);
    metadata.handleWatchers(instance);
    metadata.handleCustomDecorators(instance);
    if (instance instanceof VueComponent) {
        metadata.handleLink(instance);
        metadata.handleHook(instance);
        metadata.handlePropsWatchers(instance);
        metadata.handleComponentOption(instance);
    }
    if (instance instanceof VueService) {
        instance.setup();
    }
    // 如果instance是Service，则将instance挂在全局上
    if (metadata.isService) globalThis[instance.constructor.name] = instance;
    return metadata;
}
function getOrCreateMetadata(clazz, ctx) {
    if (!ctx || typeof ctx === "string") {
        if (typeof clazz === "object") clazz = clazz.constructor;
        let metadata = metadataMap.get(clazz);
        if (!metadata) {
            const parentClass = Object.getPrototypeOf(clazz);
            const parentMetadata = metadataMap.get(parentClass);
            if (parentMetadata) metadataMap.set(clazz, metadata = parentMetadata.clone());
            else metadataMap.set(clazz, metadata = new VueClassMetadata());
        }
        return metadata;
    } else {
        let metadata = ctx.metadata.metadata;
        if (!metadata) metadata = ctx.metadata.metadata = new VueClassMetadata();
        if (ctx.kind === "class") metadataMap.set(clazz, metadata);
        return metadata;
    }
}

/*
 * 用于为类装饰器创建Vue组件
 * @param Props 组件属性类型，继承自VueComponentBaseProps
 * @param option 可选的组件配置选项
 * @returns 返回一个函数，该函数接收类和可选的类装饰器上下文作为参数，并对类进行处理，标记为Vue组件并应用组件配置选项
 */ function Component(option) {
    // 创建一个注入函数，配置模块名
    const fn = Injectable({
        moduleName: ModuleName
    });
    // 返回一个类装饰器
    return (clazz, ctx)=>{
        // 应用注入函数
        fn(clazz, ctx);
        // 获取或创建类的元数据
        const metadata = getOrCreateMetadata(clazz, ctx);
        // 标记元数据为组件，并附加组件配置选项
        metadata.isComponent = true;
        metadata.componentOption = option;
    };
}
/*
 * 用于为类装饰器提供服务注册功能。
 * @param option 可选参数，为@Injectable装饰器的参数。
 * @returns 返回一个函数，该函数接受类和上下文作为参数，并对其进行服务注册处理。
 */ function Service(option) {
    // 创建一个 Injectable 装饰器函数，配置默认的模块名、单例模式和创建时的元数据处理。
    const fn = Injectable(Object.assign({
        moduleName: ModuleName,
        singleton: true,
        onCreate: (instance)=>applyMetadata(instance.constructor, instance),
        createImmediately: true
    }, option // 合并用户自定义的配置
    ));
    // 返回一个处理函数，用于在类上应用服务注册。
    return (clazz, ctx)=>{
        fn(clazz, ctx) // 调用@Injectable装饰器函数进行基础注册。
        ;
        getOrCreateMetadata(clazz, ctx).isService = true // 标记该类为服务。
        ;
    };
}
/*
 * 为类装饰器创建路由守卫
 * @param option 可选参数对象，用于配置路由守卫的行为
 * @param option.matchTo 可以是一个正则表达式或者一个函数，用于匹配目标路径
 * @param option.matchFrom 可以是一个正则表达式或者一个函数，用于匹配起始路径
 * @returns 返回一个函数，该函数接受类和上下文作为参数，用于注册和标记路由守卫类
 */ function RouterGuard(option) {
    // 使用Injectable装饰器创建一个单例模块，并在创建时应用元数据
    const fn = Injectable(Object.assign({
        moduleName: ModuleName,
        singleton: true,
        onCreate: (instance)=>applyMetadata(instance.constructor, instance)
    }, option));
    // 返回一个类装饰器函数
    return (clazz, ctx)=>{
        fn(clazz, ctx) // 应用Injectable装饰器
        ;
        const metadata = getOrCreateMetadata(clazz, ctx) // 获取或创建类的元数据
        ;
        metadata.isRouterGuard = true // 标记类为路由守卫
        ;
        metadata.routerGuardMatchTo = option?.matchTo // 设置匹配目标路径的规则
        ;
        metadata.routerGuardMatchFrom = option?.matchFrom // 设置匹配起始路径的规则
        ;
    };
}
/**
 * 创建一个指令装饰器。
 * @param name 指令的名称。可选参数，如果未提供，则会根据类名自动推断。
 * @returns 返回一个函数，该函数接收一个类和可选的上下文参数，并对类进行处理，将其标记为指令。
 */ function Directive(name) {
    // 创建一个可注入的函数，该函数将类和上下文标记为模块的一部分
    const fn = Injectable({
        moduleName: ModuleName
    });
    return (clazz, ctx)=>{
        // 使用注入函数处理类和上下文
        fn(clazz, ctx);
        // 获取或创建类的元数据
        const metadata = getOrCreateMetadata(clazz, ctx);
        // 标记元数据为指令
        metadata.isDirective = true;
        // 如果没有提供指令名，则根据类名自动推断
        if (!name) {
            name = clazz.name.replace(/Directive$/, "");
            name = name[0].toLowerCase() + name.slice(1);
        }
        // 设置指令名
        metadata.directiveName = name;
    };
}
/**
 * 为属性装饰器，用于标记属性为可变（Mutable）的。
 * @param shallow 可选参数，指定是否进行浅层变异。如果为true，则只对直接属性进行变异；否则，对所有嵌套属性进行深度变异。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记，表示它们可以在运行时被修改。
 */ function Mut(shallow) {
    return (target, arg)=>{
        const metadata = getOrCreateMetadata(target, arg);
        metadata.mutts.push({
            propName: getName(arg),
            shallow
        });
    };
}
/**
 * 定义一个用于创建只读属性的装饰器函数。
 * @param shallow 如果为true，则只对属性的直接值应用只读约束，而不考虑其嵌套属性。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名，用于应用只读约束。
 */ function Readonly(shallow) {
    return (target, arg)=>{
        // 获取或创建目标对象的元数据，并记录要设置为只读的属性信息
        const metadata = getOrCreateMetadata(target, arg);
        metadata.readonlys.push({
            propName: getName(arg),
            shallow
        });
    };
}
/*
 * 为Vue组件的属性创建链接
 * @param option 可选参数对象，包含以下属性：
 *   - refName?: string 引用名称
 *   - isDirective?: boolean 是否为指令
 *   - directiveName?: string 指令名称
 * @returns 返回一个函数，该函数接收两个参数：target（Vue组件）和arg（属性标识符），并执行链接的创建逻辑
 */ function Link(option) {
    return (target, arg)=>{
        // 获取或创建元数据，并添加一个新的链接到links数组
        getOrCreateMetadata(target, arg).links.push({
            propName: getName(arg),
            refName: option?.refName,
            isDirective: !!(option?.isDirective || option?.directiveName),
            directiveName: option?.directiveName // 指令名称，如果提供
        });
    };
}
/*
 * 用于在Vue组件中注入属性的装饰器
 * @param key 可选参数，指定属性的键名或键符号
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，用于装饰属性
 */ function VueInject(key) {
    return (target, arg)=>{
        // 如果没有提供key，则尝试从目标对象的属性上获取元数据
        if (!key) key = Reflect.getMetadata("design:type", target, arg)?.name;
        // 创建或获取目标对象的元数据，并记录注入的属性信息
        getOrCreateMetadata(target, arg).vueInject.push({
            propName: getName(arg),
            provideKey: key
        });
    };
}
/*
 * 定义一个用于创建计算属性的装饰器，适用于方法和getter。
 * 初始时，会被调用两次以处理getter。
 *
 * @param target 目标对象，即应用装饰器的对象。
 * @param arg 装饰器的参数，通常是属性名。
 * @returns 返回一个函数，该函数用于向目标对象的指定属性添加计算属性信息。
 */ function Computed() {
    return (target, arg)=>{
        // 向目标对象的属性添加计算属性信息
        getOrCreateMetadata(target, arg).computers.push(getName(arg));
    };
}
/**
 * 定义一个Hook装饰器函数，用于在目标对象的方法上注册hook信息。
 * @param type Hook的类型，指示这个装饰器是用来注册哪种类型的hook。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和方法名。
 *          通过这个函数，将hook信息保存到元数据中。
 */ function Hook(type) {
    return (target, arg)=>{
        // 获取或创建元数据，并将新的hook信息添加到hooks数组中
        getOrCreateMetadata(target, arg).hooks.push({
            methodName: getName(arg),
            type
        });
    };
}
/**
 * PropsWatcher 是一个用于装饰器的方法，用于监视对象属性的变化。
 * @param option 可选参数，提供给 WatchOptions 的配置项。
 * @returns 返回一个函数，该函数接收两个参数：target 和 arg，
 *          其中 target 表示目标对象，arg 表示属性名。
 *          该函数会将属性变化的监视配置添加到目标对象的元数据中。
 */ function PropsWatcher(option) {
    return (target, arg)=>{
        // 为指定目标对象的属性创建或获取监视配置，并添加到元数据中
        getOrCreateMetadata(target, arg).propsWatchers.push({
            methodName: getName(arg),
            option
        });
    };
}
/**
 * 创建一个监视器函数，用于监视Vue服务的某些变化。
 * @param option 配置对象，可选。包含source和option属性。
 * @param option.source 可以是一个监视目标或者监视目标数组。
 * @param option.option 观察选项，提供额外的配置。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。
 *          函数会将watcher信息存储到target和arg指定的元数据中。
 */ function Watcher(option) {
    return (target, arg)=>{
        // 获取或创建目标对象和参数的元数据，并将新的watcher信息添加到watchers数组中
        getOrCreateMetadata(target, arg).watchers.push({
            methodName: getName(arg),
            ...option // 扩展传入的配置选项
        });
    };
}
function VueDecorator(option) {
    return (target, arg)=>{
        getOrCreateMetadata(target, arg).vueDecorators.push({
            ...option,
            decoratedName: getDecoratedName(arg)
        });
    };
}
/**
 * 获取名称 - 根据输入参数的类型返回相应的名称
 * @param arg 可以是一个字符串或者一个包含名称属性的对象
 * @returns 返回一个字符串，表示输入参数的名称
 */ function getName(arg) {
    // 如果arg是字符串类型，则直接返回该字符串
    if (typeof arg === "string") return arg;
    // 如果arg是对象类型，则返回对象的name属性
    return arg.name;
}

/**
 * 生成一个用于监听事件的装饰器。
 * @param eventTarget 事件的目标对象，比如window或者document，也可以是EventEmitter对象，或是dom的类名。
 * @param eventName 要监听的事件名称，必须是WindowEventMap中定义的事件名。
 * @returns 返回一个函数，该函数接收两个参数：target和arg。target是应用装饰器的对象，arg是装饰的方法。
 */ function EventListener(eventTarget, eventName) {
    return VueDecorator({
        onSetup (instance, target, option) {
            if (typeof target === "function") {
                const fn = target.bind(instance);
                instance[option.decoratedName] = fn;
                if (typeof eventTarget === "string") {
                    const className = eventTarget;
                    onMounted(()=>{
                        const array = document.getElementsByClassName(className);
                        for (let el of array){
                            el.addEventListener(eventName, fn);
                        }
                    });
                } else if (eventTarget instanceof EventEmitter) eventTarget.on(eventName, fn);
                else eventTarget.addEventListener(eventName, fn);
            } else throw new Error("EventListener target must be a function");
        },
        onUnmount (_, target) {
            if (typeof eventTarget === "string") {
                const array = document.getElementsByClassName(eventTarget);
                for (let el of array){
                    el.removeEventListener(eventName, target);
                }
            } else if (eventTarget instanceof EventEmitter) eventTarget.off(eventName, target);
            else eventTarget.removeEventListener(eventName, target);
        }
    });
}
/**
 * Throttle装饰器：为方法添加节流逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */ function Throttle(delay) {
    return VueDecorator({
        onSetup (instance, target, option) {
            if (typeof target === "function") {
                instance[option.decoratedName] = throttle(target.bind(instance), delay ?? 300);
            } else throw new Error("Throttle target must be a function");
        }
    });
}
/**
 * Debounce装饰器：为方法添加防抖逻辑。
 * @returns 返回一个函数，该函数用于修饰目标对象的方法。
 */ function Debounce(delay) {
    return VueDecorator({
        onSetup (instance, target, option) {
            if (typeof target === "function") {
                instance[option.decoratedName] = debounce(target.bind(instance), delay ?? 300);
            } else throw new Error("Debounce target must be a function");
        }
    });
}
/**
 * 为属性装饰器，用于标记属性为可被一次性使用（Disposable）的。
 * @param methodName 可选参数，指定方法名。如果指定了方法名，则该属性会被视为一个方法，并且该方法会被标记为可被一次性使用。
 * @returns 返回一个函数，该函数接收两个参数：目标对象和属性名/属性符号，然后对这些属性进行标记。
 */ function Disposable(methodName = "dispose") {
    return VueDecorator({
        onUnmount (_, target) {
            if (typeof target === "object") {
                target[methodName]?.();
            }
        }
    });
}
/**
 * 一个用于绑定当前上下文到某个方法上的装饰器工厂函数。
 * 当这个装饰器被应用于方法上时，它会将该方法的上下文（this）与特定的参数绑定起来，
 * 以便于在不同的调用环境中能够保持方法的上下文一致性。
 */ function BindThis(thisTarget) {
    return VueDecorator({
        onSetup (instance, target, option) {
            if (typeof target === "function") {
                instance[option.decoratedName] = target.bind(thisTarget ?? instance);
            } else throw new Error("BindThis target must be a function");
        }
    });
}
/**
 * 被装饰的方法将在实例初始化时执行
 */ function Setup() {
    return VueDecorator({
        onSetup (_, target) {
            if (typeof target === "function") {
                target();
            } else throw new Error("Setup target must be a function");
        }
    });
}

export { BindThis, Component, Computed, Debounce, Directive, Disposable, EventListener, Hook, Link, ModuleName, Mut, PropsWatcher, ROUTER, Readonly, RouterGuard, Service, Setup, Throttle, VueClass, VueComponent, VueDecorator, VueDirective, VueInject, VueRouterGuard, VueService, Watcher, toNative };
