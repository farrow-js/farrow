import { Module, Container, createProvider, initilize, ModuleProviderSymbol } from '../module'

type PageInfo = {
  url: string
  env: string
}

const PageInfoProvider = createProvider<PageInfo>()

class User extends Module {
  page = this.use(PageInfoProvider)
  path = `${this.page.url}/user`
  get product() {
    return this.use(Product)
  }
}

class Product extends Module {
  page = this.use(PageInfoProvider)
  path = `${this.page.url}/product`
  get user() {
    return this.use(User)
  }
}

class Root extends Module {
  page = this.use(PageInfoProvider)
  user = this.use(User)
  product = this.use(Product)

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

class App extends Container {
  [ModuleProviderSymbol] = [
    PageInfoProvider.provide({
      url: '/path/for/app',
      env: 'app',
    }),
  ]
  root = this.use(Root)
  root1 = this.use(Root)
  root2 = this.new(Root, {
    providers: [
      PageInfoProvider.provide({
        url: '/path/for/new',
        env: 'new',
      }),
    ],
  })
}

const testRoot = (root: Root, page: PageInfo) => {
  it('root.page is equal to page', () => {
    expect(root.page.url).toBe(page.url)
    expect(root.page.env).toBe(page.env)
  })

  it('root is equal to root.self', () => {
    expect(root === root.self).toBe(true)
  })

  it('user.page is equal to product.page', () => {
    expect(root.user.page === root.product.page).toBe(true)
  })

  it('user.product is euqal to product', () => {
    expect(root.user.product === root.product).toBe(true)
  })

  it('product.user is equal to user', () => {
    expect(root.product.user === root.user).toBe(true)
  })

  it('product.user.product is equal to product', () => {
    expect(root.product.user.product === root.product).toBe(true)
  })
}

describe('Basic Usage of Module', () => {
  let app = new App()

  let root = initilize(Root, {
    providers: [
      PageInfoProvider.provide({
        url: '/path/for/initilize',
        env: 'initilize',
      }),
    ],
  })

  describe('initilize', () => {
    testRoot(root, {
      url: '/path/for/initilize',
      env: 'initilize',
    })
  })

  describe('app.root', () => {
    testRoot(app.root, {
      url: '/path/for/app',
      env: 'app',
    })
  })

  describe('app.root2', () => {
    testRoot(app.root2, {
      url: '/path/for/new',
      env: 'new',
    })
  })

  it('app.root is equal to app.root1', () => {
    expect(app.root === app.root1).toBe(true)
  })

  it('app.root is not equal to app.root2', () => {
    expect(app.root === app.root2).toBe(false)
  })
})
