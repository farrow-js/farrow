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
let promise = new Promise((resolve) => {
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

let model = {
  title: <Title />,
  content: <HTML />,
}

let stream = ReactServerDOMWriter.renderToReadableStream(model)
let response = new Response(stream, {
  headers: { 'Content-Type': 'text/html' },
})

void display(response)

async function display(responseToDisplay: Response) {
  let blob = await responseToDisplay.blob()
  let url = URL.createObjectURL(blob)
  let data = ReactServerDOMReader.createFromFetch(fetch(url))

  renderResult(data)
}

function Shell({ data }: { data: any }) {
  let model = data.readRoot()
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
  let container = document.getElementById('container')
  // @ts-ignore untyped
  let root = ReactDOM.unstable_createRoot(container)
  root.render(
    <Suspense fallback="Loading...">
      <Shell data={data} />
    </Suspense>,
  )
}
