import React from 'react'
import Router from 'next/router'
import { Index } from './Controller'

export const View = () => {
  const greet = Index.useState((state) => state.greet)
  const count = Index.useState((state) => state.count)
  const index = Index.use()

  const handleJump = () => {
    Router.push(`/?count=${count}`).catch((err) => {
      console.error(err)
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src="/logo.svg" className="App-logo" alt="logo" />
        <p>{greet}</p>
        <p>
          <button onClick={() => index.actions.incre()}>+1</button>
          {count}
          <button onClick={() => index.actions.decre()}>-1</button>
        </p>
        <p>
          <button onClick={handleJump}>jump to {count}</button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          {' | '}
          <a className="App-link" href="https://nextjs.org/" target="_blank" rel="noopener noreferrer">
            Learn Farrow
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://github.com/Lucifier129/farrow"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Next.js
          </a>
        </p>
      </header>
    </div>
  )
}
