import { client } from './client'

export interface User {
  id: string
  name: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  name: string
}

export const apiAuth = {
  me: () => client.get('/auth/me').json<User>(),
  register: (data: Registration) =>
    client.post('/auth/register', { json: data }).json<User>(),
  login: (data: Credentials) =>
    client.post('/auth/login', { json: data }).json<{ user: User }>(),
  logout: async () => {
    await client.post('/auth/logout')
  },
}
