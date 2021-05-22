import React from 'react'
import { usePrefix } from './hooks'

export const Link = (props: React.ComponentPropsWithoutRef<'a'>) => {
  const prefix = usePrefix()
  const href = props.href ? prefix + props.href : props.href
  return <a {...props} href={href} />
}
