import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { Controller, page } from '../index'

const delay = (duration: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration)
  })
}

type CounterState = {
  type: 'counter'
  count: number
}

class Counter extends Controller {
  initialState: CounterState = {
    type: 'counter',
    count: 0,
  }

  reducers = {
    incre(state: CounterState, step = 1): CounterState {
      return {
        ...state,
        count: state.count + step,
      }
    },
    decre(state: CounterState, step = 1): CounterState {
      return {
        ...state,
        count: state.count - step,
      }
    },
  }

  async preload() {
    let data = (await this.getJson('/count')) as { count: number }
    this.actions.incre(data.count)
  }
}

type TextManagerState = {
  type: 'text-manager'
  text: string
}

class TextManager extends Controller {
  initialState: TextManagerState = {
    type: 'text-manager',
    text: '',
  }

  reducers = {
    updateText(state: TextManagerState, text = ''): TextManagerState {
      return {
        ...state,
        text,
      }
    },
  }

  async preload() {
    let data = (await this.postJson('/text')) as { text: string }
    this.actions.updateText(data.text)
  }
}

const TestView = () => {
  let text = TextManager.useState((state) => state.text)
  let count = Counter.useState((state) => state.count)
  let counter = Counter.use()

  let handleIncre = () => {
    counter.actions.incre()
  }

  return (
    <>
      <div id="text">{text}</div>
      <div id="count">{count}</div>
      <button id="counter-incre" onClick={handleIncre}>
        +1
      </button>
    </>
  )
}

const TestPage = page({
  View: TestView,
  Controllers: {
    TextManager,
    Counter,
  },
})

describe('farrow-next', () => {
  let container: HTMLDivElement | undefined
  beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    // cleanup on exiting
    if (container) {
      ReactDOM.unmountComponentAtNode(container)
      container.remove()
      container = undefined
    }
  })

  it('works correctly', async () => {
    jest.spyOn(global, 'fetch').mockImplementation((async (url: string) => {
      await delay(10)

      if (url === '/count') {
        return {
          text() {
            return Promise.resolve(JSON.stringify({ count: 10 }))
          },
        }
      }

      if (url === '/text') {
        return {
          text() {
            return Promise.resolve(JSON.stringify({ text: 'preloaded-text' }))
          },
        }
      }

      throw new Error(`Unmocked url: ${url}`)
    }) as any)

    // preload
    let initialProps = await TestPage.getInitialProps?.({
      pathname: '/preload',
      query: {},
      AppTree: () => null,
    })

    if (!initialProps) {
      throw new Error(`Expected initialProps to be an object, instead of ${initialProps}`)
    }

    let { states, userAgent } = initialProps

    let count: number | undefined
    let text: string | undefined

    for (let state of states) {
      if (state.type === 'counter') {
        count = state.count
      } else if (state.type === 'text-manager') {
        text = state.text
      }
    }

    expect(userAgent.length > 0).toBe(true)
    expect(count).toBe(10)
    expect(text).toBe('preloaded-text')

    // render
    act(() => {
      ReactDOM.render(<TestPage {...initialProps!} />, container!)
    })

    let textElem = document.getElementById('text')
    let countElem = document.getElementById('count')
    let increElem = document.getElementById('counter-incre')

    expect(!!textElem).toBe(true)
    expect(!!countElem).toBe(true)
    expect(!!increElem).toBe(true)

    expect(textElem!.textContent).toBe(text)
    expect(countElem!.textContent).toBe(`${count}`)

    // update
    act(() => {
      increElem!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(textElem!.textContent).toBe(text)
    expect(countElem!.textContent).toBe(`${count! + 1}`)

    // remove the mock to ensure tests are completely isolated
    ;(global.fetch as any).mockRestore()
  })
})
