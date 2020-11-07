import React from 'react'
import { usePrefix } from './hooks'

export const Link = (props: React.ComponentPropsWithoutRef<'a'>) => {
  let prefix = usePrefix()
  let href = props.href ? prefix + props.href : props.href
  return <a {...props} href={href} />
}
