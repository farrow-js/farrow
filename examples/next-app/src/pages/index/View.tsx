import React, { useState, useEffect } from 'react'
import { Index } from './Controller'
import { api as TodoApi, Todo } from '../../api/todo'
import router from 'next/router'
import { Module, createProvider, Container, useQueryChangedEffect } from 'farrow-next'

export const View = () => {
  const indexCtrl = Index.use()
  const [count, setCount] = useState(110)
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const task = async () => {
      const result = await TodoApi.addTodo({
        content: `count:${count}`,
      })
      setTodos(result.todos)
    }
    task().catch((error) => {
      console.log('error', error)
    })
  }, [count])

  useQueryChangedEffect(() => {
    const page = indexCtrl.page
    console.log('changed', page.query)
    return () => {
      console.log('clean changed', page.query)
    }
  })

  const handleJump = () => {
    router.push(`/?count=${count}`).catch((error) => {
      console.log('error', error)
    })
  }

  return (
    <div className="App">
      <App />
      <pre style={{ textAlign: 'left' }}>{JSON.stringify(todos, null, 2)}</pre>
      <header className="App-header">
        <p>Hello Vite + React!</p>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>count is: {count}</button>
        </p>
        <p>
          <button onClick={handleJump}>jump to /?count={count}</button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

type AppState = {
  count: number
  text: string
}

class App extends Container.from(React.Component) {
  state: AppState = {
    count: 0,
    text: '',
  }

  providers = [this.inject(CounterProvider.provide(this)), this.inject(TextManagerProvider.provide(this))]

  // eslint-disable-next-line
  counter = this.use(Counter)

  // eslint-disable-next-line
  textManager = this.use(TextManager)

  componentDidMount() {
    console.log(this)
    this.counter.start()
  }

  componentWillUnmount() {
    this.counter.stop()
  }

  render() {
    return (
      <div className="App">
        <h1>Hello Module</h1>
        <h2>
          <div>count</div>
          <button type="button" onClick={() => this.counter.start()}>
            start
          </button>{' '}
          <button type="button" onClick={() => this.counter.stop()}>
            stop
          </button>{' '}
          {this.state.count}{' '}
          <button type="button" onClick={() => this.counter.incre()}>
            +1
          </button>{' '}
          <button type="button" onClick={() => this.counter.decre()}>
            -1
          </button>
        </h2>
        <h2>
          <div>text: {this.state.text}</div>
          <input
            type="text"
            value={this.state.text}
            onChange={(event) => this.textManager.update(event.target.value)}
          />
          <button onClick={() => this.textManager.clear()}>clear</button>
        </h2>
      </div>
    )
  }
}

interface CounterProviderType {
  state: {
    count: number
  }
  setState(satet: this['state']): void
}

const CounterProvider = createProvider<CounterProviderType>()

class Counter extends Module {
  app = this.use(CounterProvider)

  // eslint-disable-next-line
  textManager = this.use(TextManager)

  incre = (step = 1) => {
    const count = this.app.state.count + step
    this.app.setState({ count })
  }

  decre = (step = 1) => {
    const count = this.app.state.count - step
    this.app.setState({ count })
  }

  tid?: any

  start = (period = 1000) => {
    this.stop()
    this.tid = setInterval(() => {
      this.incre()
      this.textManager.update(`count=${this.app.state.count}`)
    }, period)
  }

  stop = () => {
    clearInterval(this.tid)
  }
}

interface TextManagerProviderType {
  state: {
    text: string
  }
  setState(state: this['state']): void
}

const TextManagerProvider = createProvider<TextManagerProviderType>()

class TextManager extends Module {
  app = this.use(TextManagerProvider)

  update = (text: string) => {
    this.app.setState({ text })
  }

  clear = () => {
    this.update('')
  }
}
