/**
 * a module abstraction providing dependencies management
 */

function isObject(o: unknown): o is object {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function isPlainObject(o: unknown) {
  let ctor, prot

  if (!isObject(o)) return false

  // If has modified constructor
  ctor = o.constructor
  if (ctor === undefined) return true

  // If has modified prototype
  prot = ctor.prototype
  if (!isObject(prot)) return false

  // If constructor does not have an Object-specific method
  if (Object.prototype.hasOwnProperty.call(prot, 'isPrototypeOf') === false) {
    return false
  }

  // Most likely a plain Object
  return true
}

interface AssertInstance {
  <T = object>(input: unknown): asserts input is T
}

const assertInstance: AssertInstance = (input) => {
  if (!isObject(input)) {
    throw new Error(`Expected an object, instead of ${input}`)
  }

  if (isPlainObject(input)) {
    throw new Error(`Expected an instance of Custom Class, instead of plan object: ${JSON.stringify(input)}`)
  }
}

export type ModuleCtor<T extends Module = Module> = new (ctx?: ModuleContext) => T

export type ModuleConfigCtor = new (...args: any[]) => {}

export type ModuleProvider<T = any> = {
  isModuleProvider: true
  name: string
  provide(value: T): ModuleProviderValue<T>
}

export type ModuleProviderValue<T = any> = {
  Provider: ModuleProvider<T>
  value: T
}

export function createProvider<T>(name = ''): ModuleProvider<T> {
  let Provider: ModuleProvider<T> = {
    isModuleProvider: true,
    name,
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
  modules: Map<ModuleCtor, Module>
  configs: Map<ModuleConfigCtor, object>
  providers: Map<ModuleProvider, any>
}

export const createModuleContext = (options?: ModuleContextOptions): ModuleContext => {
  let ctx: ModuleContext = {
    modules: new Map(),
    configs: new Map(),
    providers: new Map(),
  }
  attachModuleContextOptions(ctx, options, true)
  return ctx
}

export const getModule = <T extends Module>(Ctor: ModuleCtor<T>, ctx: ModuleContext): T => {
  if (ctx.modules.has(Ctor)) {
    return ctx.modules.get(Ctor)! as T
  }

  let module = new Ctor(ctx)

  ctx.modules.set(Ctor, module)

  return module as T
}

export const getModuleConfig = <T extends ModuleConfigCtor>(Ctor: T, ctx: ModuleContext): InstanceType<T> => {
  if (ctx.configs.has(Ctor)) {
    return ctx.configs.get(Ctor)! as InstanceType<T>
  }

  throw new Error(`Module Config is using without injecting: ${Ctor.name}`)
}

export const getModuleProvider = <T>(Provider: ModuleProvider<T>, ctx: ModuleContext): T => {
  if (ctx.providers.has(Provider)) {
    return ctx.providers.get(Provider)! as T
  }

  throw new Error(`Module Provider is using without injecting: ${Provider.name}`)
}

export const attachModules = (ctx: ModuleContext, modules: Module[], throws = true) => {
  for (let module of modules) {
    assertInstance<{ constructor: ModuleCtor }>(module)

    let Ctor = module.constructor

    if (ctx.modules.has(Ctor)) {
      if (throws) {
        throw new Error(`Unexpected duplicate module: ${Ctor.name}`)
      }
    } else {
      ctx.modules.set(Ctor, module)
    }
  }
}

export const attachModuleConfigs = (ctx: ModuleContext, configs: object[], throws = true) => {
  for (let config of configs) {
    assertInstance<{ constructor: ModuleConfigCtor }>(config)

    let Ctor = config.constructor

    if (ctx.configs.has(Ctor)) {
      if (throws) {
        throw new Error(`Unexpected duplicate module-config: ${Ctor.name}`)
      }
    } else {
      ctx.configs.set(Ctor, config)
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

    if (ctx.providers.has(Provider)) {
      if (throws) {
        throw new Error(`Unexpected duplicate module-provider: ${Provider.name}`)
      }
    } else {
      ctx.providers.set(Provider, value)
    }
  }
}

export type ModuleContextOptions = {
  modules?: Module[]
  configs?: object[]
  providers?: ModuleProviderValue[]
}

export const attachModuleContextOptions = (ctx: ModuleContext, options?: ModuleContextOptions, throws = true) => {
  if (options?.modules) {
    attachModules(ctx, options?.modules, throws)
  }

  if (options?.configs) {
    attachModuleConfigs(ctx, options?.configs, throws)
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

  if (ctx.modules.has(Ctor)) {
    return ctx.modules.get(Ctor)! as T
  }

  let module = new Ctor(ctx)

  ctx.modules.set(Ctor, module)

  return module
}

export const ModuleContextSymbol = Symbol('module.context')

export const ModuleConfigSymbol = Symbol('module.config')

export const ModuleProviderSymbol = Symbol('module.provider')

export const ModuleContainerSymbol = Symbol('module.container')

export type Constructable = new (...args: any[]) => any

export const Container = <T extends Constructable>(Ctor: T) => {
  return class Container extends Ctor {
    [ModuleConfigSymbol]?: object[];
    [ModuleProviderSymbol]?: ModuleProviderValue[];
    [ModuleContainerSymbol] = new ModuleContainer()

    constructor(...args: any[]) {
      super(...args)
      let container = this[ModuleContainerSymbol]
      let configs = container[ModuleContextSymbol].configs
      // a container is also a module-config which can be injected via this.use(MyContainer)
      configs.set(this.constructor as ModuleConfigCtor, this)
    }

    new<T extends Module>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
      let container = this[ModuleContainerSymbol]
      container[ModuleConfigSymbol] = this[ModuleConfigSymbol]
      container[ModuleProviderSymbol] = this[ModuleProviderSymbol]
      attachModuleContainer(container)
      return this[ModuleContainerSymbol].new(Ctor, options)
    }
    /**
     *
     * @param Ctor get instance from weak-map
     */
    use<T extends Module>(Ctor: ModuleCtor<T>): T
    use<T extends ModuleConfigCtor>(Ctor: T): InstanceType<T>
    use<T>(Ctor: ModuleProvider<T>): T
    use(Ctor: ModuleCtor | ModuleConfigCtor | ModuleProvider) {
      let container = this[ModuleContainerSymbol]
      container[ModuleConfigSymbol] = this[ModuleConfigSymbol]
      container[ModuleProviderSymbol] = this[ModuleProviderSymbol]
      attachModuleContainer(container)
      return this[ModuleContainerSymbol].use(Ctor as any)
    }
  }
}

const attachModuleContainer = <T extends ModuleContainer>(container: T) => {
  let ctx = container[ModuleContextSymbol]
  let configs = container[ModuleConfigSymbol]
  let providers = container[ModuleProviderSymbol]
  let SelfCtor = container.constructor as ModuleCtor

  // add config if needed
  if (configs) {
    attachModuleConfigs(ctx, configs, false)
  }

  // add provider if needed
  if (providers) {
    attachModuleProviderValues(ctx, providers, false)
  }

  if (container instanceof Module) {
    if (ctx.modules.has(SelfCtor)) {
      ctx.modules.set(SelfCtor, container)
    }
  } else {
    if (!ctx.configs.has(SelfCtor)) {
      ctx.configs.set(SelfCtor, container)
    }
  }
}

export class ModuleContainer {
  [ModuleConfigSymbol]?: object[];

  [ModuleProviderSymbol]?: ModuleProviderValue[];

  [ModuleContextSymbol] = createModuleContext()

  new<T extends Module>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
    attachModuleContainer(this)

    let ctx = this[ModuleContextSymbol]
    let context = createModuleContext()

    attachModuleContextOptions(context, options, true)

    // clone configs
    for (let [Config, value] of ctx.configs.entries()) {
      if (!context.configs.has(Config)) {
        context.configs.set(Config, value)
      }
    }

    // clone providers
    for (let [Provider, value] of ctx.providers.entries()) {
      if (ctx.providers.has(Provider)) {
        context.providers.set(Provider, value)
      }
    }

    let module = new Ctor(context)

    context.modules.set(Ctor, module)

    return module
  }

  /**
   *
   * @param Ctor get instance from weak-map
   */
  use<T extends Module>(Ctor: ModuleCtor<T>): T
  use<T extends ModuleConfigCtor>(Ctor: T): InstanceType<T>
  use<T>(Ctor: ModuleProvider<T>): T
  use(Ctor: ModuleCtor | ModuleConfigCtor | ModuleProvider) {
    attachModuleContainer(this)

    let ctx = this[ModuleContextSymbol]

    if (isModuleProvider(Ctor)) {
      return getModuleProvider(Ctor, ctx)
    }

    if (Ctor.prototype instanceof Module) {
      return getModule(Ctor as ModuleCtor, ctx)
    }

    return getModuleConfig(Ctor, ctx)
  }
}

export abstract class Module extends ModuleContainer {
  constructor(ctx?: ModuleContext) {
    super()
    this[ModuleContextSymbol] = ctx || this[ModuleContextSymbol]
  }
}
