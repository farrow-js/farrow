import React from 'react'

import { useRenderContext } from 'farrow-react/hooks'

export const Form: React.FC<React.ComponentPropsWithoutRef<'form'>> = (props) => {
  let basename = useRenderContext().basenames[0]

  return <form {...props} action={basename + props.action}></form>
}
