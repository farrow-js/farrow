# farrow-module

A module abstraction providing dependencies management

## Installation

```shell
# from npm
npm install --save farrow-module

# from yarn
yarn add farrow-module
```

## Glossary

- `Module`:

  - Any `Class` which `extends Module`
  - it's a basic unit for writing logic code
  - it should not define custom constructor parameters
  - it should not be instantiated via the `new` keyword manually
  - everything it needed is via `this.use(DepClass)`

- `Provider`

  - it can be created via `createProvider<Type>(defaultValue)`
  - it should be attached to `Container` via `this.inject(Provider.provide(value))`
  - it should be placed only once for a `Container`, duplicated is not allow

- `Container`

  - Any `Class` which `extends Container`
  - it's the entry of our code of `modules`
  - it should be instantiated by the `new` keyword

## Usage

```typescript
import { Module, Container, createProvider } from 'farrow-module'

type PageInfo = {
  url: string
  env: string
}

/**
 * create a provider carries extra data
 */
const PageInfo = createProvider<PageInfo>()

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
 * use [ModuleProviderSymbol] filed for providing Provider
 */
class App extends Container {
  page = this.inject(
    PageInfo.provide({
      url: '/path/for/app',
      env: 'app',
    }),
  )

  // app.root is equal to app.root1
  root = this.use(Root)

  root1 = this.use(Root)

  /**
   * create a new Root and provide new Provider
   *  app.root2 is not equal to app.root, it's a new one
   */
  root2 = this.new(Root, {
    providers: [
      PageInfo.provide({
        url: '/path/for/new',
        env: 'new',
      }),
    ],
  })
}

const app = new App()

app.root.getInfo()
```

## API

### Module#use(DepClass)

`module.use(DepClass)` will read or create a DepClass instance from the `Container`

### Module#inject(providerValue)

`module.inject` will add `provider-value` or `container` to the `Container`

### Module#new(DepClass, options?)

`module.new(DepClass, options)` will create a new DepClass instance in current container/context

- `options.providers`, an list of values created by `Provider` for injecting/reusing.
- `options.modules`, an list of modules for injecting/resuing.

### Container.from(Class)

`Container.from(Class)` can extends a existed `Class` make it become a `Container` which supports `this.use()` and `this.new()`

### createProvider<Type>(defaultValue?)

`createProvider<Type>(defaultValue?)` create a `Provider` by given `Type` and `defaultValue`

- `Provider.provide(value)`: create a injectable value of `Provider` for `Container`
- `Provider.defaultValue`: the `defaultValue` of `Provider`, it's optional, maybe `undefined`
