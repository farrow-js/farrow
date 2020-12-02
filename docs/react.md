# Farrow-React API

```typescript
// farrow-hooks for rendering react component
import { useReactView } from 'farrow-react'

// react component for auto prefix
import { Link } from 'farrow-react/Link'

import {
  // react-hooks version of usePrefix
  usePrefix,
  // access current render context
  useRenderContext,
} from 'farrow-react/hooks'

// ReactContext for rendering
import { ReactRenderContext } from 'farrow-react/Context'
```

## useReactView (options?: ReactViewOptions) => { render(element: JSX.Element): Http.Response}

use react for rendering

```tsx
type ReactResponseOptions = {
  // config doctype
  docType?: string
}

type ReactViewOptions = ReactResponseOptions & {
  // use stream or string
  useStream?: boolean
}

type ReactView = {
  // render react element to farrow http response
  render: <T extends JSX.Element>(element: T) => Http.Response
}
```

## usePrefix(): string

```tsx
const Test = () => {
  let prefix = usePrefix()
  return <div>{prefix}</div>
}
```

## useRenderContext(): string

```tsx
type ReactRenderContext = {
  // basenames taken from farrow-http
  basenames: string[]
}

const Test = () => {
  let renderContext = useRenderContext()
  return <div>{renderContext.basenames.join('')}</div>
}
```

## Link

```tsx
// Link's props is equal to <a />
<Link href="/">a link</Link>
```
