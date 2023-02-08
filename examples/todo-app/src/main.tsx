import React from 'react'
import ReactDOM from 'react-dom'
import { apiPipeline } from 'farrow-api-client'
import './index.css'
import App from './App'

apiPipeline.use((request, next) => {
  console.log('request', request)
  return next()
})

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)
