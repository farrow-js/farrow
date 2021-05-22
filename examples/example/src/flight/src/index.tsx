import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
// @ts-ignore untyped
import ReactServerDOMReader from 'react-server-dom-webpack'
// @ts-ignore untyped
import ReactServerDOMWriter from 'react-server-dom-webpack/writer.browser.server'

function Text({ children }: React.PropsWithChildren<{}>) {
  return <span>{children}</span>
}

function HTML() {
  return (
    <div>
      <Text>hello</Text>
      <Text>world</Text>
    </div>
  )
}

let resolved = false
const promise = new Promise((resolve) => {
  setTimeout(() => {
    resolved = true
    resolve(null)
  }, 100)
})
function read() {
  if (!resolved) {
    throw promise
  }
}

function Title() {
  read()
  return <>Title</>
}

const model = {
  title: <Title />,
  content: <HTML />,
}

const stream = ReactServerDOMWriter.renderToReadableStream(model)
const response = new Response(stream, {
  headers: { 'Content-Type': 'text/html' },
})

void display(response)

async function display(responseToDisplay: Response) {
  const blob = await responseToDisplay.blob()
  const url = URL.createObjectURL(blob)
  const data = ReactServerDOMReader.createFromFetch(fetch(url))

  renderResult(data)
}

function Shell({ data }: { data: any }) {
  const model = data.readRoot()
  return (
    <div>
      <Suspense fallback="...">
        <h1>{model.title}</h1>
      </Suspense>
      {model.content}
    </div>
  )
}

function renderResult(data: any) {
  const container = document.getElementById('container')
  // @ts-ignore untyped
  const root = ReactDOM.unstable_createRoot(container)
  root.render(
    <Suspense fallback="Loading...">
      <Shell data={data} />
    </Suspense>,
  )
}
