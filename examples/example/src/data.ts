export type Todo = {
  id: number
  content: string
  completed: boolean
}

export type Todos = Todo[]

export let fakeData: Todos = [
  {
    id: -1,
    content: 'Learn Farrow',
    completed: true,
  },
  {
    id: -2,
    content: 'Learn TypeScript',
    completed: true,
  },
]
