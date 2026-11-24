import { client } from './client'

export const PAGE_SIZE = 20

export interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTodo {
  title: string
  description?: string
}

export interface UpdateTodo {
  title?: string
  description?: string | null
  completed?: boolean
}

export const apiTodo = {
  list: (offset = 0, signal?: AbortSignal) =>
    client
      .get('/todos', {
        searchParams: { limit: PAGE_SIZE + 1, offset },
        signal,
      })
      .json<Todo[]>(),
  create: (data: CreateTodo) =>
    client.post('/todos', { json: data }).json<Todo>(),
  update: (id: string, data: UpdateTodo) =>
    client
      .patch(`/todos/${encodeURIComponent(id)}`, { json: data })
      .json<Todo>(),
  remove: async (id: string) => {
    await client.delete(`/todos/${encodeURIComponent(id)}`)
  },
}
