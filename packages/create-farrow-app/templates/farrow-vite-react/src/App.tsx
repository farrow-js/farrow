import React, { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { api as GreetApi } from './api/greet'

function App() {
  let [greet, setGreet] = useState('')

  useEffect(() => {
    let task = async () => {
      let result = await GreetApi.greet({
        name: `Farrow + React + Vite`,
      })
      setGreet(result.greet)
    }
    task().catch((error) => {
      console.log('error', error)
    })
  }, [])

  if (!greet) return null

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{greet}</p>
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
            href="https://github.com/Lucifier129/farrow"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Farrow
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Vite
          </a>
        </p>
      </header>
    </div>
  )
}

export default App
