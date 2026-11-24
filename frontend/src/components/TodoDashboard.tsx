import {
  ArrowRight,
  Check,
  Circle,
  ClipboardList,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTodo } from '../hooks/useTodo'
import type { User } from '../services/apiAuth'
import { errorMessage } from '../services/client'

type Filter = 'all' | 'active' | 'done'

interface TodoDashboardProps {
  user: User
}

export default function TodoDashboard({ user }: TodoDashboardProps) {
  const { logout } = useAuth()
  const {
    todos,
    loading,
    error: listError,
    retry,
    hasMore,
    loadingMore,
    loadMore,
    working: todoWorking,
    create,
    update,
    remove,
  } = useTodo(user.id)
  const working = todoWorking || logout.isPending
  const [actionError, setActionError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  async function perform(action: () => Promise<unknown>, after?: () => void) {
    setActionError('')
    try {
      await action()
      after?.()
    } catch (cause) {
      setActionError(errorMessage(cause))
    }
  }

  function createTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle || nextTitle.length > 255) return
    void perform(
      () =>
        create.mutateAsync({
          title: nextTitle,
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      () => {
        setTitle('')
        setDescription('')
        setFilter('all')
      },
    )
  }

  function saveEdit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const nextTitle = editTitle.trim()
    if (!nextTitle || nextTitle.length > 255) return
    void perform(
      () =>
        update.mutateAsync({
          id,
          data: {
            title: nextTitle,
            description: editDescription.trim() || null,
          },
        }),
      () => setEditingId(null),
    )
  }

  const visible = todos.filter(
    (todo) =>
      filter === 'all' ||
      (filter === 'active' ? !todo.completed : todo.completed),
  )
  const completedCount = todos.filter((todo) => todo.completed).length

  return (
    <main className="page-wrap px-4 pb-20 pt-8 sm:pt-12">
      <section className="rise-in mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="island-kicker mb-2">Your little corner of clarity</p>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            Hello, {user.name.trim().split(/\s+/)[0]}.
          </h1>
          <p className="mt-2 text-[var(--sea-ink-soft)]">
            Let’s make today feel a little lighter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void perform(() => logout.mutateAsync())}
          disabled={working || loadingMore}
          className="secondary-button"
        >
          <LogOut size={16} aria-hidden="true" /> Sign out
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-6">
          <section
            className="island-shell rounded-[1.75rem] p-5 sm:p-7"
            aria-labelledby="add-heading"
          >
            <p className="island-kicker mb-2">A fresh start</p>
            <h2
              id="add-heading"
              className="display-title mb-5 text-2xl font-bold"
            >
              Add something to your list
            </h2>
            <form onSubmit={createTodo} className="space-y-3">
              <label className="sr-only" htmlFor="new-title">
                Todo title
              </label>
              <input
                id="new-title"
                className="form-input"
                placeholder="What needs doing?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
                required
              />
              <label className="sr-only" htmlFor="new-description">
                Description (optional)
              </label>
              <textarea
                id="new-description"
                className="form-input min-h-20 resize-y"
                placeholder="Add a note (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <button
                className="primary-button"
                type="submit"
                disabled={working || loading || loadingMore || !title.trim()}
              >
                <Plus size={18} aria-hidden="true" /> Add todo
              </button>
            </form>
          </section>

          <section
            className="island-shell rounded-[1.75rem] p-5 sm:p-7"
            aria-labelledby="list-heading"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="island-kicker mb-1">One thing at a time</p>
                <h2
                  id="list-heading"
                  className="display-title text-2xl font-bold"
                >
                  Your todos
                </h2>
              </div>
              <span className="rounded-full bg-[var(--sand)] px-3 py-1 text-xs font-bold text-[var(--palm)]">
                {todos.length}
                {hasMore ? '+' : ''} loaded
              </span>
            </div>

            <fieldset className="mb-5 flex min-w-0 flex-wrap gap-2 border-0 p-0">
              <legend className="sr-only">Filter loaded todos</legend>
              {(
                [
                  ['all', 'All'],
                  ['active', 'To do'],
                  ['done', 'Done'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${filter === value ? 'bg-[var(--sea-ink)] text-[var(--foam)]' : 'border border-[var(--line)] text-[var(--sea-ink-soft)] hover:bg-[var(--sand)]'}`}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            {(actionError || listError) && (
              <p role="alert" className="error-note mb-5">
                {actionError || errorMessage(listError)}
              </p>
            )}
            {loading ? (
              <output className="block py-12 text-center text-[var(--sea-ink-soft)]">
                Loading your todos…
              </output>
            ) : listError && todos.length === 0 ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => void retry()}
              >
                Try loading again
              </button>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-12 text-center">
                <ClipboardList
                  className="mx-auto mb-3 text-[var(--lagoon-deep)]"
                  size={32}
                  aria-hidden="true"
                />
                <p className="font-bold">
                  {todos.length === 0
                    ? 'A fresh page, just for you.'
                    : 'Nothing here yet.'}
                </p>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                  {todos.length === 0
                    ? 'Add your first todo above.'
                    : hasMore
                      ? 'Try another filter or load more todos.'
                      : 'Try another filter.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map((todo) => (
                  <li key={todo.id} className="todo-card">
                    {editingId === todo.id ? (
                      <form
                        onSubmit={(event) => saveEdit(event, todo.id)}
                        className="flex-1 space-y-3"
                      >
                        <label
                          className="sr-only"
                          htmlFor={`edit-title-${todo.id}`}
                        >
                          Todo title
                        </label>
                        <input
                          id={`edit-title-${todo.id}`}
                          className="form-input"
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          maxLength={255}
                          required
                        />
                        <label
                          className="sr-only"
                          htmlFor={`edit-description-${todo.id}`}
                        >
                          Description
                        </label>
                        <textarea
                          id={`edit-description-${todo.id}`}
                          className="form-input min-h-20 resize-y"
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          placeholder="Add a note (optional)"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="primary-button"
                            disabled={
                              working || loadingMore || !editTitle.trim()
                            }
                          >
                            Save changes
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setEditingId(null)}
                            disabled={working || loadingMore}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void perform(() =>
                              update.mutateAsync({
                                id: todo.id,
                                data: { completed: !todo.completed },
                              }),
                            )
                          }
                          className="mt-0.5 shrink-0 text-[var(--lagoon-deep)] hover:scale-110"
                          disabled={working || loadingMore}
                          aria-label={`${todo.completed ? 'Mark incomplete' : 'Mark complete'}: ${todo.title}`}
                          aria-pressed={todo.completed}
                        >
                          {todo.completed ? (
                            <Check size={22} aria-hidden="true" />
                          ) : (
                            <Circle size={22} aria-hidden="true" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-bold break-words ${todo.completed ? 'text-[var(--sea-ink-soft)] line-through' : ''}`}
                          >
                            {todo.title}
                          </p>
                          {todo.description && (
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--sea-ink-soft)]">
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Edit ${todo.title}`}
                            disabled={working || loadingMore}
                            onClick={() => {
                              setEditingId(todo.id)
                              setEditTitle(todo.title)
                              setEditDescription(todo.description ?? '')
                            }}
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-button hover:text-red-600"
                            aria-label={`Delete ${todo.title}`}
                            disabled={working || loadingMore}
                            onClick={() => {
                              if (window.confirm(`Delete "${todo.title}"?`))
                                void perform(() => remove.mutateAsync(todo.id))
                            }}
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!loading && hasMore && (
              <button
                type="button"
                onClick={() => {
                  setActionError('')
                  void loadMore().then((result) => {
                    if (result.isError)
                      setActionError(errorMessage(result.error))
                  })
                }}
                disabled={loadingMore || working}
                className="secondary-button mt-5 w-full justify-center"
              >
                {loadingMore ? 'Loading…' : 'Load more todos'}
                {!loadingMore && <ArrowRight size={16} aria-hidden="true" />}
              </button>
            )}
          </section>
        </div>

        <aside className="island-shell rounded-[1.75rem] p-6 lg:sticky lg:top-24">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[var(--sand)] text-[var(--palm)]">
            <Check size={24} aria-hidden="true" />
          </div>
          <p className="island-kicker mb-2">A little progress adds up</p>
          <h2 className="display-title text-2xl font-bold">You’ve got this.</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
            {loading
              ? 'Getting your list ready…'
              : `${completedCount} of ${todos.length} loaded ${todos.length === 1 ? 'todo' : 'todos'} complete.`}
          </p>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--sand)]"
            role="progressbar"
            aria-label="Loaded todos completed"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={todos.length || 1}
          >
            <div
              className="h-full rounded-full bg-[var(--lagoon)] transition-all"
              style={{
                width: `${todos.length ? (completedCount / todos.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-5 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--sea-ink-soft)]">
            Your list is private to your account. Progress and filters reflect
            the todos loaded on this page.
          </p>
        </aside>
      </div>
    </main>
  )
}
