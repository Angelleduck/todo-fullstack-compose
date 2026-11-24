import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  apiTodo,
  type CreateTodo,
  PAGE_SIZE,
  type UpdateTodo,
} from '../services/apiTodo'
import { ApiError } from '../services/client'
import { authKey } from './useAuth'

export function useTodo(userId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['todos', userId] as const

  const list = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => apiTodo.list(pageParam, signal),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length > PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    retry: false,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })
  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      void queryClient.invalidateQueries({ queryKey: authKey })
    }
  }

  // If the session was revoked while the list was open, show the sign-in screen.
  useEffect(() => {
    if (list.error instanceof ApiError && list.error.status === 401) {
      void queryClient.invalidateQueries({ queryKey: authKey })
    }
  }, [list.error, queryClient])

  const create = useMutation({
    mutationFn: (data: CreateTodo) => apiTodo.create(data),
    onSuccess: invalidate,
    onError: handleError,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodo }) =>
      apiTodo.update(id, data),
    onSuccess: invalidate,
    onError: handleError,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiTodo.remove(id),
    onSuccess: invalidate,
    onError: handleError,
  })

  return {
    todos: list.data?.pages.flatMap((page) => page.slice(0, PAGE_SIZE)) ?? [],
    loading: list.isPending && list.isFetching,
    error: list.error,
    retry: list.refetch,
    hasMore: list.hasNextPage,
    loadingMore: list.isFetchingNextPage,
    loadMore: list.fetchNextPage,
    working: create.isPending || update.isPending || remove.isPending,
    create,
    update,
    remove,
  }
}
