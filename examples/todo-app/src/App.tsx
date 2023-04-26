import React, { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { Todo } from './api/todo'
import { TodoApi } from './apis'

function App() {
  const [count, setCount] = useState(110)
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const task = async () => {
      TodoApi.longTask(
        {},
        {
          cache: false,
        },
      )
      const result = await TodoApi.addTodo({
        content: `count:${count}`,
      })
      setTodos(result.todos)
    }
    task().catch((error) => {
      console.log('error', error)
    })
  }, [count])

  useEffect(() => {
    TodoApi.longTask({})
    TodoApi.addTodo({
      content: `batch:0`,
    })
    TodoApi.addTodo({
      content: `batch:1`,
    })
  }, [])

  return (
    <div className="App">
      <pre style={{ textAlign: 'left' }}>{JSON.stringify(todos, null, 2)}</pre>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>count is: {count}</button>
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

export default App
