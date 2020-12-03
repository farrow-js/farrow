import React, { useMemo } from 'react'

type TodoActionProps = {
  action: string
  method?: string
}
export const TodoAction: React.FC<TodoActionProps> = (props) => {
  let formId = useMemo(() => {
    return Math.random().toString(32).substr(7)
  }, [])

  return (
    <>
      <form action={`/action/todos${props.action}`} method={props.method ?? 'POST'} style={{ display: 'none' }}>
        <button id={formId} type="submit">
          submit form
        </button>
      </form>
      <label style={{ display: 'inline' }} htmlFor={formId}>
        {props.children}
      </label>
    </>
  )
}
