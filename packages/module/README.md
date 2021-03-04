# farrow-module

A module abstraction providing dependencies management

## Glossary

- `module`:

  - Any `Class` which `extends Module`
  - it's a basic unit for writing logic code
  - it should not be define custom constructor paramaters
  - it should not be instantiated via `new` keyword manually except for testing
  - everything it needed is via `this.use(DepClass)`

- `module-config`

  - Any normal `Class` for injecting some data to `module`
  - it can has its own constructor paramaters
  - it should be instantiate by `new` keywords in `module-container`
  - it should be placed only one for a `module-container`, duplicated is not allow

- `module-container`

  - Any `Class` which `extends ModuleContainer`
  - it's the entry of our code of `modules`
  - it should be instantiate by `new` keywords
  - it can use `[ModuleConfigSymbol]` filed for providing `module-config`

## Usage

```typescript
import { Module, ModuleContainer, ModuleConfigSymbol } from 'farrow-module'

/**
 * define a normal class for injecting module-config
 */
class PageInfo {
  url: string
  env: string
  constructor(url: string, env: string) {
    this.url = url
    this.env = env
  }
}

/**
 * define a module class and inject deps via this.use(Dep)
 */
class User extends Module {
  // inject PageInfo
  page = this.use(PageInfo)
  path = `${this.page.url}/user`
  // supporting circular dependencies via getter
  get product() {
    return this.use(Product)
  }
}

/**
 * define a module class and inject deps via this.use(Dep)
 */
class Product extends Module {
  // inject PageInfo
  page = this.use(PageInfo)
  path = `${this.page.url}/product`
  // supporting circular dependencies via getter
  get user() {
    return this.use(User)
  }
}

/**
 * define a module class and inject deps via this.use(Dep)
 */
class Root extends Module {
  // inject PageInfo
  page = this.use(PageInfo)
  // inject User
  user = this.use(User)
  // inject Product
  product = this.use(Product)

  // self-injection via getter
  get self() {
    return this.use(Root)
  }

  getInfo() {
    return {
      url: this.page.url,
      env: this.page.env,
      user: this.user.path,
      product: this.product.path,
    }
  }
}

/**
 * define a module-container class for entry
 * use [ModuleConfigSymbol] filed for providing module-config
 */
class App extends ModuleContainer {
  [ModuleConfigSymbol] = [new PageInfo('/path/for/app', 'app')]

  // app.root is equal to app.root1
  root = this.use(Root)

  root1 = this.use(Root)

  /**
   * create a new Root and provide new module-config
   *  app.root2 is not equal to app.root, it's a new one
   */
  root2 = this.new(Root, {
    configs: [new PageInfo('/path/for/new', 'new')],
  })
}

const app = new App()

app.root.getInfo()
```

## API

### Module#use(DepClass)

`module.use(DepClass)` will read or create a DepClass instance from the `module-container`

### Module#new(DepClass, options?)

`module.new(DepClass, options)` will create a new DepClass instance

- `options.configs`, an list of `module-config` instances for injecting.

### ModuleContainer#[ModuleConfigSymbol]

`ModuleContainer#[ModuleConfigSymbol]` is a place for injecting `module-config` in `module-container`
