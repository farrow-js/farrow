import React from 'react'

import { useRenderContext } from 'farrow-react/hooks'

export const Form: React.FC<React.ComponentPropsWithoutRef<'form'>> = (props) => {
  const [basename] = useRenderContext().basenames

  return <form {...props} action={basename + props.action}></form>
}
