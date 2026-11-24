import { createFileRoute } from '@tanstack/react-router'
import AuthForm from '../components/AuthForm'
import TodoDashboard from '../components/TodoDashboard'
import { useAuth } from '../hooks/useAuth'
import { errorMessage } from '../services/client'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user, checking, error, retry } = useAuth()

  if (checking) {
    return (
      <main className="page-wrap px-4 py-24 text-center text-[var(--sea-ink-soft)]">
        <output>Getting your workspace ready…</output>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-wrap px-4 py-24 text-center">
        <p role="alert" className="mb-5 text-[var(--sea-ink)]">
          {errorMessage(error)}
        </p>
        <button
          className="primary-button mx-auto"
          type="button"
          onClick={() => {
            void retry()
          }}
        >
          Try again
        </button>
      </main>
    )
  }

  return user ? <TodoDashboard user={user} /> : <AuthForm />
}
