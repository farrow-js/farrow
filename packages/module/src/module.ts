/**
 * a module abstraction providing dependencies management
 */
export type Injectable = {
  __injectable__: true
}

export type InjectableCtor<T = {}> = (new (...args: any[]) => T) & Injectable

export type ModuleCtor<T extends Module = Module> = (new (ctx?: ModuleContext) => T) & Injectable

export type ModuleProvider<T = any> = {
  isModuleProvider: true
  defaultValue?: T
  provide(value: T): ModuleProviderValue<T>
} & Injectable

export type ModuleProviderValue<T = any> = {
  Provider: ModuleProvider<T>
  value: T
}

export function createProvider<T>(defaultValue?: T): ModuleProvider<T> {
  let Provider: ModuleProvider<T> = {
    __injectable__: true,
    isModuleProvider: true,
    defaultValue,
    provide(value) {
      return {
        Provider,
        value,
      }
    },
  }
  return Provider
}

export const isModuleProvider = <T>(input: any): input is ModuleProvider<T> => {
  return !!input?.isModuleProvider
}

export type ModuleContext = {
  injectables: Map<Injectable, any>
}

export const createModuleContext = (options?: ModuleContextOptions): ModuleContext => {
  let ctx: ModuleContext = {
    injectables: new Map(),
  }
  attachModuleContextOptions(ctx, options, true)
  return ctx
}

export const getModule = <T extends Module>(Ctor: ModuleCtor<T>, ctx: ModuleContext): T => {
  if (ctx.injectables.has(Ctor)) {
    return ctx.injectables.get(Ctor)! as T
  }

  let module = new Ctor(ctx)

  ctx.injectables.set(Ctor, module)

  return module as T
}

export const getModuleProvider = <T>(Provider: ModuleProvider<T>, ctx: ModuleContext): T => {
  if (ctx.injectables.has(Provider)) {
    return ctx.injectables.get(Provider)! as T
  }

  if (Provider.defaultValue !== undefined) {
    return Provider.defaultValue
  }

  throw new Error(`Provider is using without injecting`)
}

export const getInjectable = <T>(Injectable: Injectable, ctx: ModuleContext): T => {
  if (ctx.injectables.has(Injectable)) {
    return ctx.injectables.get(Injectable)! as T
  }

  throw new Error(`Injectable is using without injecting: ${Injectable}`)
}

export const attachModules = (ctx: ModuleContext, modules: Module[], throws = true) => {
  for (let module of modules) {
    let Ctor = module.constructor as ModuleCtor

    if (ctx.injectables.has(Ctor)) {
      if (throws) {
        throw new Error(`Unexpected duplicate module: ${Ctor.name}`)
      }
    } else {
      ctx.injectables.set(Ctor, module)
    }
  }
}

export const attachModuleProviderValues = (
  ctx: ModuleContext,
  providerValues: ModuleProviderValue[],
  throws = true,
) => {
  for (let providerValue of providerValues) {
    let { Provider, value } = providerValue

    if (ctx.injectables.has(Provider)) {
      if (throws) {
        throw new Error(`Unexpected duplicate Provider`)
      }
    } else {
      ctx.injectables.set(Provider, value)
    }
  }
}

export type ModuleContextOptions = {
  modules?: Module[]
  providers?: ModuleProviderValue[]
}

export const attachModuleContextOptions = (ctx: ModuleContext, options?: ModuleContextOptions, throws = true) => {
  if (options?.modules) {
    attachModules(ctx, options?.modules, throws)
  }

  if (options?.providers) {
    attachModuleProviderValues(ctx, options?.providers, throws)
  }
}

export const initilize = <T extends Module>(
  Ctor: ModuleCtor<T>,
  options?: ModuleContextOptions,
  ctx: ModuleContext = createModuleContext(),
) => {
  attachModuleContextOptions(ctx, options, true)

  if (ctx.injectables.has(Ctor)) {
    return ctx.injectables.get(Ctor)! as T
  }

  let module = new Ctor(ctx)

  ctx.injectables.set(Ctor, module)

  return module
}

export const ModuleContextSymbol = Symbol('module.context')

export const ModuleProviderSymbol = Symbol('module.provider')

export const ModuleContainerSymbol = Symbol('module.container')

export type Constructable = new (...args: any[]) => any

const attachModuleContainer = <T extends Container>(container: T) => {
  let ctx = container[ModuleContextSymbol]
  let providers = container[ModuleProviderSymbol]
  let SelfCtor = container.constructor as InjectableCtor<T>

  // add provider if needed
  if (providers) {
    attachModuleProviderValues(ctx, providers, false)
  }

  // add Self if needed
  if (!ctx.injectables.has(SelfCtor)) {
    ctx.injectables.set(SelfCtor, container)
  }
}

const mixinModuleContainer = <T extends Constructable>(Ctor: T) => {
  return class ContainerMixin extends Ctor implements ModuleContextual {
    // mark injectable
    static __injectable__ = true as const;

    [ModuleProviderSymbol]?: ModuleProviderValue[];
    [ModuleContainerSymbol] = new Container()

    get [ModuleContextSymbol]() {
      return this[ModuleContainerSymbol][ModuleContextSymbol]
    }

    set [ModuleContextSymbol](ctx) {
      this[ModuleContainerSymbol][ModuleContextSymbol] = ctx
    }

    constructor(...args: any[]) {
      super(...args)
      let container = this[ModuleContainerSymbol]
      let ctx = container[ModuleContextSymbol]
      // a container is also a module-config which can be injected via this.use(MyContainer)
      ctx.injectables.set(this.constructor as typeof ContainerMixin, this)
    }

    new<T extends Module>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
      let container = this[ModuleContainerSymbol]
      container[ModuleProviderSymbol] = this[ModuleProviderSymbol]
      return container.new(Ctor, options)
    }
    /**
     *
     * @param Ctor get instance from container
     */
    use<T>(Ctor: InjectableCtor<T>): T
    use<T>(Ctor: ModuleProvider<T>): T
    use<T extends ModuleContextual>(Ctor: () => T): T
    use(Ctor: InjectableCtor | ModuleProvider | (() => ModuleContextual)) {
      let container = this[ModuleContainerSymbol]
      container[ModuleProviderSymbol] = this[ModuleProviderSymbol]
      return container.use(Ctor as any)
    }
  }
}

export type ModuleContextual = {
  [ModuleContextSymbol]: ModuleContext
}

let currentContext: ModuleContext | undefined

let currentProviderValues: ModuleProviderValue[] | undefined

export class Container implements ModuleContextual {
  // mark injectable
  static __injectable__ = true as const

  static from<T extends Constructable>(Ctor: T) {
    return mixinModuleContainer(Ctor)
  }

  [ModuleProviderSymbol] = currentProviderValues;

  [ModuleContextSymbol] = currentContext ?? createModuleContext()

  new<T extends Module>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
    attachModuleContainer(this)

    let ctx = this[ModuleContextSymbol]
    let context = createModuleContext()

    // clone module/providers from options
    attachModuleContextOptions(context, options, true)

    // clone providers from current container
    for (let [Injectable, value] of ctx.injectables.entries()) {
      if (isModuleProvider(Injectable)) {
        if (!context.injectables.has(Injectable)) {
          context.injectables.set(Injectable, value)
        }
      }
    }

    let module = initilize(Ctor, undefined, context)

    return module
  }

  /**
   *
   * @param Ctor get instance from container
   */
  use<T>(Ctor: InjectableCtor<T>): T
  use<T>(Ctor: ModuleProvider<T>): T
  use<T extends ModuleContextual>(Ctor: () => T): T
  use(Ctor: InjectableCtor | ModuleProvider | (() => ModuleContextual)) {
    attachModuleContainer(this)

    let ctx = this[ModuleContextSymbol]

    // handle module provider
    if (isModuleProvider(Ctor)) {
      return getModuleProvider(Ctor, ctx)
    }

    // handle normal module
    if (Ctor.prototype instanceof Module) {
      return getModule(Ctor as ModuleCtor, ctx)
    }

    // handle injectable like container or container-mixin
    if ('__injectable__' in Ctor) {
      return getInjectable(Ctor, ctx)
    }

    // connect the context for this.use(new MyContainer(xxx))
    if (typeof Ctor === 'function') {
      let prevContext = currentContext
      let prevProviderValues = currentProviderValues
      try {
        currentContext = ctx
        currentProviderValues = this[ModuleProviderSymbol]
        return Ctor()
      } finally {
        currentContext = prevContext
        currentProviderValues = prevProviderValues
      }
    }

    throw new Error(`Unsupported input in this.use(): ${Ctor}`)
  }
}

export abstract class Module extends Container {
  constructor(ctx?: ModuleContext) {
    super()
    this[ModuleContextSymbol] = ctx || this[ModuleContextSymbol]
  }
}
