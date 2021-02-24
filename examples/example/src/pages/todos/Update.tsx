import React from 'react'

import { Link } from 'farrow-react/Link'

import { Form } from '../components/Form'

import { Todo } from '../../data'

export const Update: React.FC<{ todo: Todo }> = ({ todo }) => {
  return (
    <>
      <header>
        <h1>Farrow Todo List</h1>
        <p>
          <Link href="/">
            <i>Back</i>
          </Link>
        </p>
      </header>
      <main>
        <section>
          <Form action={`/action/todos/update/${todo.id}`} method="POST">
            <header>
              <h2>Update Todo</h2>
            </header>
            <label htmlFor="content">content:</label>
            <input type="text" name="content" placeholder="input your todo content" defaultValue={todo.content} />
            <button type="submit">Submit</button>
          </Form>
        </section>
      </main>
    </>
  )
}
