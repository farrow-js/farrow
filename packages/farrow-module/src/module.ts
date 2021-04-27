/**
 * ModuleProvider for inject interface/data
 */
export type ModuleProvider<T = any> = {
  isModuleProvider: true
  defaultValue?: T
  provide(value: T): ModuleProviderValue<T>
}

export type ModuleProviderValue<T = any> = {
  Provider: ModuleProvider<T>
  value: T
}

export const isModuleProviderValue = <T = any>(input: any): input is ModuleProviderValue<T> => {
  return !!(input && 'Provider' in input && 'value' in input)
}

export function createProvider<T>(defaultValue?: T): ModuleProvider<T> {
  let Provider: ModuleProvider<T> = {
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

/**
 * ModuleContext for manager dependencies
 */
export type ModuleCtor<T = any> = new (...args: any[]) => T

export type Injectable<T = any> = ModuleCtor<T> | ModuleProvider<T>

export type ModuleContextOptions = {
  modules?: object[]
  providers?: ModuleProviderValue[]
}

export class ModuleContext {
  deps = {
    modules: new Map<ModuleCtor, unknown>(),
    providers: new Map<ModuleProvider, unknown>(),
  }

  /**
   * add ModuleCtor instance
   * @param Dep
   * @param module
   * @param replace replace current value or throw error
   */
  addModule<T>(Ctor: ModuleCtor<T>, module: T, replace = false): this {
    if (this.deps.modules.has(Ctor)) {
      let current = this.deps.modules.get(Ctor)! as T

      if (replace) {
        this.deps.modules.set(Ctor, module)
      } else if (module !== current) {
        throw new Error(`Unexpected duplicate ModuleConstructor: ${Ctor}`)
      }

      return this
    }
    this.deps.modules.set(Ctor, module)
    return this
  }

  /**
   * add Provider value
   * @param Provider
   * @param value
   * @param replace replace current value or throw error
   */
  addProvider<T>(Provider: ModuleProvider<T>, value: T, replace = false): this {
    if (this.deps.providers.has(Provider)) {
      let current = this.deps.providers.get(Provider)! as T

      if (replace) {
        this.deps.providers.set(Provider, value)
      } else if (value !== current) {
        throw new Error(`Unexpected duplicate Provider`)
      }

      return this
    }
    this.deps.providers.set(Provider, value)
    return this
  }

  /**
   * get ModuleCtor instance
   * @param ModuleCtor
   */
  useModule<T>(Ctor: ModuleCtor<T>): T {
    if (this.deps.modules.has(Ctor)) {
      return this.deps.modules.get(Ctor)! as T
    }

    if (Ctor.length > 0) {
      throw new Error(`The ModuleConstructor was not found in context: ${Ctor}`)
    }

    return newModule(Ctor, this)
  }

  /**
   * get Provider value
   * @param Provider
   */
  useProvider<T>(Provider: ModuleProvider<T>): T {
    if (this.deps.providers.has(Provider)) {
      return this.deps.providers.get(Provider)! as T
    }

    if (Provider.defaultValue !== undefined) {
      return Provider.defaultValue
    }

    throw new Error(`The Provider is used without injecting or no defaultValue found`)
  }

  /**
   * get dep by Dep key
   * @param Dep
   */
  use<T>(Dep: ModuleCtor<T>): T
  use<T>(Dep: ModuleProvider<T>): T
  use<T>(Dep: Injectable<T>): T {
    if (isModuleProvider(Dep)) {
      return this.useProvider(Dep)
    }
    return this.useModule(Dep)
  }

  /**
   * inject provider-value
   * @param providerValue
   */
  inject<T>(providerValue: ModuleProviderValue<T>): T {
    let { Provider, value } = providerValue
    this.addProvider(Provider, value)
    return value
  }

  /**
   * inject modules to module-context
   * @param modules
   */
  injectModules(modules: object[]) {
    for (let module of modules) {
      if (module.constructor === Object || module.constructor === Array || module.constructor === Function) {
        throw new Error(`Expected module to be an instance of custom Class, instead of ${JSON.stringify(module)}`)
      }
      this.addModule(module.constructor as ModuleCtor, module, true)
    }
    return this
  }

  /**
   * inject provider-values to module-context
   * @param providers
   */
  injectProviderValues(providers: ModuleProviderValue[]) {
    for (let { Provider, value } of providers) {
      this.addProvider(Provider, value, true)
    }
    return this
  }

  /**
   * create a new context for Dep
   * @param Ctor
   * @param options options for resusing deps or others
   */
  new<T>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
    let ctx = new ModuleContext()

    // reusing provider-values of current-context
    for (let [Provider, value] of this.deps.providers.entries()) {
      ctx.addProvider(Provider, value)
    }

    // inject modules
    if (options?.modules) {
      ctx.injectModules(options.modules)
    }

    // inject provider-values
    if (options?.providers) {
      ctx.injectProviderValues(options.providers)
    }

    return newModule(Ctor, ctx)
  }
}

/**
 * ModuleContextManager for manager ModuleContext
 */

let currentModuleContext: ModuleContext | undefined

export const runInContext = <T>(f: () => T, ctx = new ModuleContext()) => {
  let prevModuleContext = currentModuleContext
  try {
    currentModuleContext = ctx
    let module = f()
    if (module && typeof module !== 'object') {
      throw new Error(`Expected function return object, but got ${module}`)
    }
    currentModuleContext.injectModules([(module as unknown) as object])
    Context.set((module as unknown) as object, currentModuleContext)
    return module
  } finally {
    currentModuleContext = prevModuleContext
  }
}

export const newModule = <T>(Ctor: ModuleCtor<T>, ctx = new ModuleContext()) => {
  if (Ctor.length > 0) {
    throw new Error(`Expected ModuleConstructor without parameters, but got ${Ctor}`)
  }
  return runInContext(() => new Ctor(), ctx)
}

class ModuleContextManager {
  contexts = new WeakMap<object, ModuleContext>()

  set(object: object, ctx: ModuleContext) {
    this.contexts.set(object, ctx)
  }

  from(object: object): ModuleContext {
    if (this.contexts.has(object)) {
      return this.contexts.get(object)!
    }

    let context = currentModuleContext ?? new ModuleContext()

    this.set(object, context)
    context.injectModules([object])

    return context
  }

  /**
   * get dep by Dep key
   * @param Dep
   */
  use<T>(Dep: ModuleCtor<T>): T
  use<T>(Dep: ModuleProvider<T>): T
  use<T>(Dep: Injectable<T>): T {
    if (!currentModuleContext) {
      throw new Error(`Expected use(...) call with runInContext(f)`)
    }
    return currentModuleContext.use(Dep as any)
  }

  /**
   * inject provider-value
   * @param providerValue
   */
  inject<T>(providerValue: ModuleProviderValue<T>): T {
    if (!currentModuleContext) {
      throw new Error(`Expected inject(...) call with runInContext(f)`)
    }
    return currentModuleContext.inject(providerValue)
  }

  /**
   * create a new context for Dep
   * @param Ctor
   * @param options options for resusing deps or others
   */
  new<T>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
    if (!currentModuleContext) {
      throw new Error(`Expected new(...) call with runInContext(f)`)
    }
    return currentModuleContext.new(Ctor, options)
  }
}

export const Context = new ModuleContextManager()

/**
 * Container and Module
 */

export class Container {
  static from<T extends ModuleCtor>(Ctor: T) {
    return class InjectableClass extends Ctor {
      constructor(...args: any[]) {
        super(...args)
        /**
         * add instance to current-context with Constructor as key
         */
        Context.from(this).addModule(this.constructor as ModuleCtor, this)
      }

      /**
       * get dep by Dep key
       * @param Dep
       */
      use<T>(Dep: ModuleCtor<T>): T
      use<T>(Dep: ModuleProvider<T>): T
      use<T>(Dep: Injectable<T>): T {
        return Context.from(this).use(Dep as any)
      }

      /**
       * inject provider-value
       * @param providerValue
       */
      inject<T>(providerValue: ModuleProviderValue<T>): T {
        return Context.from(this).inject(providerValue)
      }

      /**
       * create a new context for Dep
       * @param Ctor
       * @param options options for resusing deps or others
       */
      new<T>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
        return Context.from(this).new(Ctor, options)
      }
    }
  }

  constructor() {
    /**
     * add instance to current-context with Constructor as key
     */
    Context.from(this).addModule(this.constructor as ModuleCtor, this)
  }
  /**
   * get dep by Dep key
   * @param Dep
   */
  use<T>(Dep: ModuleCtor<T>): T
  use<T>(Dep: ModuleProvider<T>): T
  use<T>(Dep: Injectable<T>): T {
    return Context.from(this).use(Dep as any)
  }

  /**
   * inject provider-value
   * @param providerValue
   */
  inject<T>(providerValue: ModuleProviderValue<T>): T {
    return Context.from(this).inject(providerValue)
  }

  /**
   * create a new context for Dep
   * @param Ctor
   * @param options options for resusing deps or others
   */
  new<T>(Ctor: ModuleCtor<T>, options?: ModuleContextOptions): T {
    return Context.from(this).new(Ctor, options)
  }
}

export class Module extends Container {}

export const initialize = <T>(Dep: ModuleCtor<T>, options?: ModuleContextOptions, ctx = new ModuleContext()) => {
  return ctx.new(Dep, options)
}
