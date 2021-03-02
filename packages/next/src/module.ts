/**
 * a module abstraction providing dependencies management
 */

export type ModuleCtor<T extends Module = Module> = new (ctx: ModuleContext) => T

export type ModuleConfigCtor<T extends ModuleConfig = ModuleConfig> = new (...args: any) => T

export type ModuleContext = {
  modules: WeakMap<ModuleCtor, Module>
  configs: WeakMap<ModuleConfigCtor, ModuleConfig>
}

const ModuleContextKey = Symbol('module.context.key')

let disableContructorCall = true

export const newModule = <T extends Module>(Ctor: ModuleCtor<T>, ctx: ModuleContext): T => {
  disableContructorCall = false
  let module = new Ctor(ctx)
  disableContructorCall = true
  return module
}

export const getModule = <T extends Module>(module: Module, Ctor: ModuleCtor<T>): T => {
  let ctx = module[ModuleContextKey]

  if (ctx.modules.has(Ctor)) {
    return ctx.modules.get(Ctor)! as T
  }

  let m = newModule(Ctor, ctx)

  ctx.modules.set(Ctor, m)

  return m as T
}

export const getModuleConfig = <T extends ModuleConfig>(module: Module, Ctor: ModuleConfigCtor<T>): T => {
  let ctx = module[ModuleContextKey]

  if (ctx.configs.has(Ctor)) {
    return ctx.configs.get(Ctor)! as T
  }

  throw new Error(`Module Config ${Ctor} is using without injecting`)
}

export const createModuleContext = (): ModuleContext => ({
  modules: new WeakMap(),
  configs: new WeakMap(),
})

export const initilize = <T extends Module>(
  Ctor: ModuleCtor<T>,
  moduleConfigs: ModuleConfig[],
  ctx: ModuleContext = createModuleContext(),
) => {
  let { modules, configs } = ctx

  moduleConfigs.forEach((moduleConfig) => {
    configs.set(moduleConfig.constructor as ModuleConfigCtor, moduleConfig)
  })

  let module = newModule(Ctor, { modules, configs })

  modules.set(Ctor, module)

  return module
}

export abstract class ModuleConfig {}

export abstract class Module {
  [ModuleContextKey]: ModuleContext

  constructor(ctx: ModuleContext) {
    if (disableContructorCall) {
      throw new Error('Should not new Module() manually, using this.using(ModuleCtor) instead')
    }
    this[ModuleContextKey] = ctx
  }

  /**
   *
   * @param Ctor get instance from weak-map
   */
  use<T extends Module>(Ctor: ModuleCtor<T>): T

  use<T extends ModuleConfig>(Ctor: new (...args: any) => T): T

  use(Ctor: new (...args: any) => any) {
    if (Ctor.prototype instanceof ModuleConfig) {
      return getModuleConfig(this, Ctor)
    }
    if (Ctor.prototype instanceof Module) {
      return getModule(this, Ctor)
    }
    throw new Error(`Unsupported Constructor: ${Ctor}`)
  }
}

/**
 * examples
 */

// class PageInfo extends ModuleConfig {
//   constructor(public url: string, public env: string) {
//     super()
//   }
// }

// class User extends Module {
//   page = this.use(PageInfo)
//   path = `${this.page.url}/user`
//   get product() {
//     return this.use(Product)
//   }
// }

// class Product extends Module {
//   page = this.use(PageInfo)
//   path = `${this.page.url}/product`
//   get user() {
//     return this.use(User)
//   }
// }

// class Root extends Module {
//   page = this.use(PageInfo)
//   user = this.use(User)
//   product = this.use(Product)

//   get self() {
//     return this.use(Root)
//   }

//   getInfo() {
//     return {
//       url: this.page.url,
//       env: this.page.env,
//       user: this.user.path,
//       product: this.product.path,
//     }
//   }
// }

// let root = initilize(Root, [new PageInfo('/path/for/test', 'test')])

// console.log('info', {
//   info: root.self.self.self.getInfo(),
//   [`root is equal to root.self`]: root === root.self,
//   [`user.page is equal to product.page`]: root.user.page === root.product.page,
//   [`user.product is euqal to product`]: root.user.product === root.product,
//   [`product.user is equal to user`]: root.product.user === root.user,
//   [`product.user.product is equal to product`]: root.product.user.product === root.product
// })
