import React from 'react'
import { AppProps } from 'next/app'
import '../src/css/index.css'
import '../src/css/App.css'

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default App
