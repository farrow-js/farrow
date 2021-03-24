# farrow-next

`farrow-next` is an upper-level business framework based on the `next.js` package, containing

- A conceptual architecture based on the classic `MVC`

- A `redux-based` state management

- Based on the model of `Inverse of Control` and `Dependency Injection` to manage business code

- Provides a friendly `React-Hooks api`

- Wraps `cookie|fetch|userAgent` and other convenient isomorphic methods

- Based on `TypeScript` development, providing good type derivation capabilities

- ...

## Installation

```shell
# via npm
npm install --save farrow-next

# via yarn
yarn add farrow-next
```

## Contents

- [Basic Usage](#basic-usage)
- [React Hooks API](#react-hooks-api)
- [Controller API](#controller-api)
- [Controller Life-Cycle](#controller-life-cycle)
- [Dependency Injection](#dependency-injection)

## Basic Usage

Each page consists of 3 parts: `Model`, `View`, `Controller`.

- `Model` manages the state of the application and its changes
- `View` manages the interface of the application and its event binding
- `Controller` manages the asynchronous interaction of the application (e.g. requesting data)

In `farrow-next`, the `Model` is inside the `Controller` and each `Controller` has its own `Model` that it maintains.

Each `Model` consists of `state` and `reducers/actions`, which can be understood as a `redux-store`.

There is only one `View`, but there can be multiple `Controllers`.

The `View` accesses the `state, actions` and other properties or methods inside each `Controller` through the `hooks api`.

### Step 1: Define the Controller

`Controller` can be defined as many times as needed.

```typescript
// counter/Controller.ts
import { Controller } from 'farrow-next'

/**
 * Define state type
 */
export type CounterState = {
  count: number
}

/*
 * Define Controller
 */
export class Counter extends Controller {
  /**
   * Declare the initialization state
   */
  initialState: CounterState = {
    count: 0,
  }

  /**
   * Define reducers
   * expresses the actions to update the state
   */
  reducers = {
    incre(state: CounterState, step = 1) {
      return {
        ...state,
        count: state.count + step,
      }
    },
    decre(state: CounterState, step = 1) {
      return {
        ...state,
        count: state.count - step,
      }
    },
  }

  /**
   * Whether to enable redux-devtools
   * default is true
   */
  devtools = true

  /**
   * Whether to enable redux-logger
   * default is false
   */
  logger = false

  /**
   * Declare the preload lifecycle function
   * This function is called before the component is rendered and corresponds to the timing of the execution of getInitialProps
   * In this function, asynchronous processing is done to call actions to update the store
   */
  async preload() {
    /*
     * Access to the latest state
     * internally execute this.store.getState()
     */
    this.state

    /**
     * Call action
     * this.actions has the same key as this.reducers
     * but it is bound to this.store, which will automatically update the state in store when called
     */
    this.actions.incre(10)

    /**
     * Access the uesr-agent string
     * On the server side, it is automatically retrieved from req.headers['user-agent'].
     * On the client side it is retrieved from window.navigator.userAgent
     This.userAgent 
     */
    this.userAgent

    /*
     * Access to cookies
     * Internally, it automatically coordinates the server/client to break different cookie sources
     */
    this.getCookie('a')
    this.setCookie('a', 'b')

    /**
     * Send a GET request
     * The first parameter is the request address
     * The second parameter is the requested query string
     * internally it will be spliced as /pathname?a=1&b=abc
     * Return an asynchronous json object
     */
    let json = await this.getJson('/pathname', {
      a: 1,
      b: 'abc',
    })

    /**
     * Send a POST request
     * The first parameter is the request address
     * The second parameter is the body
     * returns an asynchronous json object
     */
    let json = await this.postJson('/pathname', {
      a: 1,
      b: 'abc',
    })
  }
}
```

## Step 2: Defining View

A `View` is a `React Component`, and in any function component, you can:

- Get an instance of `Controller` with `Controller.use()`.

- Pull state data from `Controller` via `Controller.useState(selector?)`, and automatically update the view when the state changes

```tsx
// counter/View.tsx
import React from 'react'
import { Counter } from '. /controllers/Counter'

export const View = () => {
  // Get the instance
  const counter = Counter.use()
  // Get and listen for state changes
  const count = Counter.useState((state) => state.count)
  return (
    <>
      <h1>count: {count}</h1>
      <button type="button" onClick={() => counter.actions.incre(10)}>
        incre
      </button> <button type="button" onClick={() => counter.actions.decre()}>
        decre
      </button>
    </>
  )
}
```

### Step 3: Create the Page component

After completing the two steps, we need to bind them together to create a page.

```typescript
// counter/index.tsx
import { page } from 'farrow-next'
import { Counter } from '. /controllers/Counter'
import { View } from '. /View'

/**
 * page(options) create Page component
 */
export default page({
  View: View,
  /**
   * Bind the Controllers that the view depends on
   * Only the bound Controllers are accessible via hooks in the component
   */
  Controllers: {
    counter: Counter,
  },

  /**
   * preload callback
   * It will be executed after all controller.preload() executions are finished
   * Instances with parameters in the page#Controllers field can access their data and call their methods.
   */
  async preload({ counter }) {
    counter.actions.incre()
  },
})
```

### Step 4: Expose the Page component

In `pages/xxx.ts`, expose the `Page` component to be accessible via url.

```typescript
// pages/counter.ts
export { default } from '. /src/pages/counter'
```

## API

### React Hooks API

#### Controller.use()

Get the `Controller` instance in the `React Function Component`

```typescript
let ctrl = Controller.use()
```

#### Controller.useState(selector?, compare?)

Get and listen to `Controller`'s `state` in `React Function Component`

- selector (optional) with `state` as argument returns the result of the state selected from it, default is state => state
- compare (optional), with `(currState, prevState)`, returns `true` if the component needs to be re-rendered, or `false` if it is not. The default is `shallowEqual` which is shallow compared two object.

```typescript
let state = Controller.useState((state) => state, shallowEqual)
```

#### usePageInfo(): PageInfo

`usePageInfo` to access current page info

```typescript
import { usePageInfo } from 'farrow-next'

const App = () => {
  let pageInfo = usePageInfo()
  // ...
}

type PageInfo = {
  /**
   * userAgent
   */
  userAgent?: string

  /**
   * Error object if encountered during rendering
   */
  err?: NextPageContext['err']

  /**
   * `HTTP` request object.
   */
  req?: NextPageContext['req']

  /**
   * `HTTP` response object.
   */
  res?: NextPageContext['res']

  /**
   * Path section of `URL`.
   */
  pathname: NextPageContext['pathname']

  /**
   * Query string section of `URL` parsed as an object.
   */
  query: NextPageContext['query']

  /**
   * `String` of the actual path including query.
   */
  asPath?: NextPageContext['asPath']
}
```

#### useQueryChangedEffect(effectCallback)

`useQueryChangedEffect` to perform effect when query was changed

```typescript
import { useQueryChangedEffect } from 'farrow-next'

const App = () => {
  useQueryChangedEffect(() => {
    let changed = false
    // do something
    return () => {
      // clean up
      changed = true
    }
  })
}
```

### Controller API

#### controller.initialState

Initial state of the `Controller` to initialize the `redux store`

#### controller.reducers

The `reducers` object of a `Controller` contains the `reducer` function to update the `state`.

`reducers` is an object `{ [key: string]: Reducer }` whose `key` is its `action-type`.

```typescript
reducers = {
  incre(state: CounterState, step = 1) {
    return {
      ...state,
      count: state.count + step,
    }
  },
  decre(state: CounterState, step = 1) {
    return {
      ...state,
      count: state.count - step,
    }
  },
}
```

#### controller.store

Access the `redux-store` constructed from `initialState/reducers`

#### controller.state

Accesses the current `this.store.getState()` latest state

#### controller.actions

Accesses the `actions` update function of `redux-store`, with the same structure as `this.reducers`.

#### controller.page

Access the data associated with `NextPageContext`, structured roughly as follows

```typescript
interface PageInfo {
  /**
   * Error object if encountered during rendering
   */
  err?:
    | (Error & {
        statusCode?: number
      })
    | null
  /**
   * `HTTP` request object.
   */
  req?: IncomingMessage
  /**
   * `HTTP` response object.
   */
  res?: ServerResponse
  /**
   * Path section of `URL`.
   */
  pathname: string
  /**
   * Query string section of `URL` parsed as an object.
   */
  query: ParsedUrlQuery
  /**
   * `String` of the actual path including query.
   */
  asPath?: string
}
```

#### controller.devtools

Whether to enable `redux-devtools`, default is `true`.

Supports `boolean | string`, if it is `string`, it will be displayed as the name in `redux-devtools`, which can be displayed normally even after compressing the code (the default name is the class name of `Controller.name`, which becomes a single letter after compressing.

#### controller.logger

Whether to enable `redux-logger`, default is `false`.

#### controller.fetch(url:string, options?: RequestInit)

`fetch` method wrapper, automatically handles `cookie` passing internally, interface is consistent with global variable `fetch`

See `fetch` [documentation](https://github.github.io/fetch/) for more information.

#### controller.getJson(url:string, params?:object, options?: RequestInit): json

The controller.getJson method is a method based on the controller.fetch wrapper to make it easier to send get requests.

The url parameters are handled in the same way as the controller.fetch method.

The params parameter will be internally querystring.stringify and spliced after the url.

The options parameter will be passed as options for the fetch.

#### controller.postJson(url:string, body?:object, options?:RequestInit): json

The controller.postJson method is based on the controller.fetch wrapper method, and is a simpler way to send post requests.

The url parameter is handled in the same way as the controller.fetch method.

If the data is an object, it will be internally JSON.stringify and then sent to the server as a request payload

The options parameter will be passed as options for the fetch.

#### controller.getCookie(key:string)

controller.getCookie is used to get the value of the cookie corresponding to the key parameter.

#### controller.setCookie(key:string, value:string, options?:object)

controller.setCookie is used to set the value of the cookie corresponding to the key parameter. The third parameter options is an object, see [documentation](https://github.com/js-cookie/js-cookie#cookie-attributes)

#### controller.removeCookie(key:string, options?:object)

controller.removeCookie is used to remove the value of the cookie corresponding to the key parameter. The third parameter options is an object, see [documentation](https://github.com/js-cookie/js-cookie#cookie-attributes)

#### controller.redirect(url)

`controller.redirect` is used to redirect, it will take care the `server/client`, and chose the right way to redirect.

#### controller.isClient

controller.isClient is a boolean value that determines whether the client is currently on the server.

#### controller.isServer

controller.isServer is the boolean value that determines whether the client is currently on the server side.

#### controller.userAgent

Gets the `userAgent` string, which can be used to construct other properties or methods such as `controller.isWeixin`.

#### controller.use(Controller)

The `controller.use` method is used to implement dependency injection and returns the instance of the used class.

See [Dependency Injection](#dependency-injection) for more on this.

### Controller Life-Cycle

#### controller.preload?(): Promise<void>

Call on preload phase(before component rendering), you can fetch `SSR` related data in this method

```typescript
class Test extends Controller {
  // Preload data
  async preload() {
    let json = await this.postJson(url, this.state.body)
    this.actions.updateJson(json)
  }
}
```

### Dependency Injection

The `Controller class` implements dependency injection, meaning that within a `Controller`, instances of other controllers can be injected via `this.use(Controller)`, and can even refer to each other.

This mechanism facilitates modularity by giving preference to combinations over inheritance.

```typescript
// Define User controllers
class UserCtrl extends Controller {
  // Login method
  async login() {
    await this.getJson('/login')
  }
  // login on preload
  async preload() {
    await this.login()
  }
}

// Define the Product controller
class ProductCtrl extends Controller {
  // Inject user
  user = this.use(UserCtrl)
}

// Define Order controller
class OrderCtrl extends Controller {
  // inject user, which is the same instance as the product controller
  user = this.use(UserCtrl)
}

// Define the page controller
class HomePageCtrl extends Controller {
  // Inject the other controllers needed for the page
  user = this.use(UserCtrl)
  product = this.use(ProductCtrl)
  order = this.use(OrderCtrl)
}
```
