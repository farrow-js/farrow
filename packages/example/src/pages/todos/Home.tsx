import React from 'react'

import { Link } from 'farrow-react/Link'

import { Todos } from '../../data'
import { TodoAction } from './components/TodoAction'

export const Home: React.FC<{ todos: Todos }> = ({ todos }) => {
  return (
    <>
      <header>
        <h1>Farrow Todo List</h1>

        <p>
          <Link href="/create">
            <b>Add Todo →</b>
          </Link>
        </p>
      </header>
      <main>
        <section>
          {todos.map((todo) => {
            return (
              <aside key={todo.id}>
                <h3 style={{ width: '100%', height: 40, overflow: 'auto' }}>{todo.content}</h3>
                <TodoAction action={`/toggle/${todo.id}`}>
                  <sup>{todo.completed ? 'completed' : 'active'}</sup>
                </TodoAction>
                <div>
                  <Link href={`/update/${todo.id}`}>edit</Link>{' '}
                  <TodoAction action={`/delete/${todo.id}`}>
                    <small>delete</small>
                  </TodoAction>
                </div>
              </aside>
            )
          })}
        </section>
      </main>
    </>
  )
}
