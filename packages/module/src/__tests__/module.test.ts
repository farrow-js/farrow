import { Module, Container, createProvider, initilize } from '../module'

type PageInfo = {
  url: string
  env: string
}

const PageInfo = createProvider<PageInfo>()

class User extends Module {
  page = this.use(PageInfo)
  path = `${this.page.url}/user`
  get product() {
    return this.use(Product)
  }
}

class Product extends Module {
  page = this.use(PageInfo)
  path = `${this.page.url}/product`
  get user() {
    return this.use(User)
  }
}

class Root extends Module {
  page = this.use(PageInfo)
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
  page = this.use(
    PageInfo.provide({
      url: '/path/for/app',
      env: 'app',
    }),
  )
  root = this.use(Root)
  root1 = this.use(Root)
  root2 = this.new(Root, {
    providers: [
      PageInfo.provide({
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
      PageInfo.provide({
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

describe('Container', () => {
  it('support using Container as entry', () => {
    class Root extends Container {
      prefix: string

      constructor(prefix: string) {
        super()
        this.prefix = prefix
      }

      show() {
        return `${this.prefix}/root`
      }

      a = this.use(A)
      b = this.use(B)
    }

    class A extends Module {
      root = this.use(Root)
      show() {
        return `${this.root.show()}/a`
      }
    }

    class B extends Module {
      root = this.use(Root)
      show() {
        return `${this.root.show()}/b`
      }
    }

    let root = new Root('container')

    // Root inherit Container
    expect(root instanceof Container).toBe(true)
    expect(root.a instanceof A).toBe(true)
    expect(root.b instanceof B).toBe(true)

    // a Container can be injected to its dependencies too
    expect(root.a.root === root).toBe(true)
    expect(root.b.root === root).toBe(true)
    expect(root.a.root === root.b.root).toBe(true)

    expect(root.show()).toBe('container/root')
    expect(root.a.show()).toBe('container/root/a')
    expect(root.b.show()).toBe('container/root/b')
  })

  it('support making another Class to a Contaienr via Container.from', () => {
    class Base {
      prefix: string
      constructor(prefix: string = '') {
        this.prefix = prefix
      }
      show() {
        return `${this.prefix}/base`
      }
    }

    class Root extends Container.from(Base) {
      a = this.use(A)
      b = this.use(B)
    }

    class A extends Module {
      root = this.use(Root)
      show() {
        return `${this.root.show()}/a`
      }
    }

    class B extends Module {
      root = this.use(Root)
      show() {
        return `${this.root.show()}/b`
      }
    }

    let root = new Root('container/from')

    // Container.from does not inherit Container, it just mixin
    expect(root instanceof Container).toBe(false)
    expect(root instanceof Base).toBe(true)
    expect(root.a instanceof A).toBe(true)
    expect(root.b instanceof B).toBe(true)

    // a minxin Container can be injected to its dependencies too
    expect(root.a.root === root).toBe(true)
    expect(root.b.root === root).toBe(true)
    expect(root.a.root === root.b.root).toBe(true)

    expect(root.show()).toBe('container/from/base')
    expect(root.a.show()).toBe('container/from/base/a')
    expect(root.b.show()).toBe('container/from/base/b')
  })

  it('support share the same context in multiple containers', () => {
    type Data = {
      count: number
    }

    let Data = createProvider<Data>()

    class A extends Module {
      data = this.use(Data)
      show() {
        return 'A'
      }
    }

    class Container0 extends Container {
      data = this.use(Data)
      a = this.use(A)
      name: string
      constructor(name = '') {
        super()
        this.name = name
      }
    }

    class Container1 extends Container {
      data = this.use(Data)
      a = this.use(A)
      name: string
      constructor(name = '') {
        super()
        this.name = name
      }
    }

    class Container2 extends Container {
      data = this.use(Data.provide({ count: 100 }))
      a = this.use(A)
      container0 = this.use(() => new Container0('0'))
      container1 = this.use(() => new Container1('1'))
    }

    let container2 = new Container2()

    expect(container2.data === container2.container0.data).toBe(true)
    expect(container2.data === container2.container1.data).toBe(true)

    expect(container2.a === container2.container0.a).toBe(true)
    expect(container2.a === container2.container1.a).toBe(true)
  })
})

describe('Provider', () => {
  it('support reusing or re-injecting providers in this.new()', () => {
    interface Data {
      count: number
    }

    let Data = createProvider<Data>({
      count: 10,
    })

    class A extends Module {
      data = this.use(Data)
    }

    class Root extends Container {
      data = this.use(
        Data.provide({
          count: 100,
        }),
      )
      useA = this.use(A)
      newA = this.new(A)

      newAWithProviders = this.new(A, {
        providers: [
          Data.provide({
            count: 200,
          }),
        ],
      })
    }

    let root = new Root()

    expect(root.useA === root.newA).toBe(false)
    expect(root.newA === root.newAWithProviders).toBe(false)

    expect(root.newA.data === root.useA.data).toBe(true)
    expect(root.useA.data === root.newAWithProviders.data).toBe(false)

    expect(root.useA.data).toEqual({
      count: 100,
    })

    expect(root.newA.data).toEqual({
      count: 100,
    })

    expect(root.newAWithProviders.data).toEqual({
      count: 200,
    })
  })

  it('support default value', () => {
    interface Data {
      count: number
    }

    let Data = createProvider<Data>({
      count: 10,
    })

    class Root extends Container {
      data = this.use(Data)
    }

    let root = new Root()

    expect(root.data).toEqual({
      count: 10,
    })

    expect(root.data === Data.defaultValue).toBe(true)
  })
})

describe('Module', () => {
  it('can inject module to this.new()', () => {
    class A extends Module {
      count = 0
      incre() {
        this.count++
      }
      decre() {
        this.count--
      }
    }

    class Child extends Module {
      a = this.use(A)
    }

    class Root extends Container {
      child = this.use(Child)
      a = this.use(A)
      newChild = this.new(Child, {
        modules: [this.a],
      })
    }

    let root = new Root()

    expect(root.child.a === root.a).toBe(true)
    expect(root.newChild.a === root.child.a).toBe(true)
    expect(root.newChild === root.child).toBe(false)
  })
})
