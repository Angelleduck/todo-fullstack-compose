import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiAuth,
  type Credentials,
  type Registration,
  type User,
} from '../services/apiAuth'
import { ApiError } from '../services/client'

export const authKey = ['auth', 'me'] as const

export function useAuth() {
  const queryClient = useQueryClient()
  const session = useQuery<User | null>({
    queryKey: authKey,
    queryFn: async () => {
      try {
        return await apiAuth.me()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
    staleTime: 30_000,
  })

  const login = useMutation({
    mutationFn: (data: Credentials) => apiAuth.login(data),
    onSuccess: async ({ user }) => {
      await queryClient.cancelQueries({ queryKey: authKey })
      queryClient.removeQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(authKey, user)
    },
  })

  const register = useMutation({
    mutationFn: async (data: Registration) => {
      await apiAuth.register(data)
      return apiAuth.login({ email: data.email, password: data.password })
    },
    onSuccess: async ({ user }) => {
      await queryClient.cancelQueries({ queryKey: authKey })
      queryClient.removeQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(authKey, user)
    },
  })

  const logout = useMutation({
    mutationFn: apiAuth.logout,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: authKey })
      queryClient.removeQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(authKey, null)
    },
  })

  return {
    user: session.data ?? null,
    checking: session.isPending && session.isFetching,
    error: session.error,
    retry: session.refetch,
    login,
    register,
    logout,
  }
}
