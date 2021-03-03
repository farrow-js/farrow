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

export type ModuleCtor<T extends Module = Module> = new (ctx: ModuleContext) => T

export type Constructor = new (...args: any[]) => {}

export type ModuleContext = {
  modules: WeakMap<ModuleCtor, Module>
  configs: WeakMap<Constructor, object>
}

const ModuleContextKey = Symbol('module.context.key')

export const ModuleConfigKey = Symbol('module.config.key')

let disableContructorCall = true

export const newModule = <T extends Module>(Ctor: ModuleCtor<T>, ctx: ModuleContext): T => {
  disableContructorCall = false
  let module = new Ctor(ctx)
  disableContructorCall = true
  return module
}

export const getModule = <T extends Module>(Ctor: ModuleCtor<T>, ctx: ModuleContext): T => {
  if (ctx.modules.has(Ctor)) {
    return ctx.modules.get(Ctor)! as T
  }

  let m = newModule(Ctor, ctx)

  ctx.modules.set(Ctor, m)

  return m as T
}

export const getModuleConfig = <T extends Constructor>(Ctor: T, ctx: ModuleContext): InstanceType<T> => {
  if (ctx.configs.has(Ctor)) {
    return ctx.configs.get(Ctor)! as InstanceType<T>
  }

  throw new Error(`Module Config ${Ctor} is using without injecting`)
}

export const createModuleContext = (): ModuleContext => ({
  modules: new WeakMap(),
  configs: new WeakMap(),
})

const attachModuleConfig = (ctx: ModuleContext, configs: any[]) => {
  for (let config of configs) {
    if (!isObject(config)) {
      throw new Error(`Expected module-config to be an object, instead of ${config}`)
    }

    if (isPlainObject(config)) {
      throw new Error(
        `Expected module-config be an instance of some Class, instead of plan object: ${JSON.stringify(config)}`,
      )
    }

    let ConfigCtor = config.constructor as Constructor
    let hasConfig = ctx.configs.has(ConfigCtor)

    if (!hasConfig) {
      ctx.configs.set(ConfigCtor, config)
    }
  }
}

export const initilize = <T extends Module>(
  Ctor: ModuleCtor<T>,
  moduleConfigs: object[],
  ctx: ModuleContext = createModuleContext(),
) => {
  attachModuleConfig(ctx, moduleConfigs)

  if (ctx.modules.has(Ctor)) {
    return ctx.modules.get(Ctor)! as T
  }

  let module = newModule(Ctor, ctx)

  ctx.modules.set(Ctor, module)

  return module
}

export abstract class BaseModule {
  [ModuleConfigKey]?: object[];

  [ModuleContextKey] = createModuleContext()

  /**
   *
   * @param Ctor get instance from weak-map
   */
  use<T extends Module>(Ctor: ModuleCtor<T>): T

  use<T extends Constructor>(Ctor: T): InstanceType<T>

  use(Ctor: new (...args: any) => any) {
    let configs = this[ModuleConfigKey]
    let ctx = this[ModuleContextKey]

    if (configs) {
      attachModuleConfig(ctx, configs)
    }

    if (!(this instanceof Module)) {
      let Self = this.constructor as Constructor
      if (!ctx.configs.has(Self)) {
        ctx.configs.set(Self, this)
      }
    }

    if (Ctor.prototype instanceof Module) {
      return getModule(Ctor, ctx)
    }

    return getModuleConfig(Ctor, ctx)
  }
}

export abstract class Module extends BaseModule {
  constructor(ctx: ModuleContext) {
    super()
    if (disableContructorCall) {
      throw new Error('Should not new Module() manually, using this.using(ModuleCtor) instead')
    }
    this[ModuleContextKey] = ctx
  }
}

/**
 * examples
 */

// class PageInfo {
//   constructor(public url: string, public env: string) {}
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

// class Home extends Module {
//   root = this.use(Root)
//   get app() {
//     return this.use(App)
//   }
// }

// class App {
//   home = initilize(Home, [this, new PageInfo('/path/for/test', 'test')])
// }

// let app = new App()

// let root = initilize(Root, [new PageInfo('/path/for/test', 'test')])

// let log = (root: Root, tag = 'info') => {
//   console.log(tag, {
//     info: root.self.self.self.getInfo(),
//     [`root is equal to root.self`]: root === root.self,
//     [`user.page is equal to product.page`]: root.user.page === root.product.page,
//     [`user.product is euqal to product`]: root.user.product === root.product,
//     [`product.user is equal to user`]: root.product.user === root.user,
//     [`product.user.product is equal to product`]: root.product.user.product === root.product,
//   })
// }

// log(app.home.root, 'app.home.root')
// log(root, 'root')

// console.log({
//   [`app.home.app is equal to app`]: app === app.home.app,
// })
