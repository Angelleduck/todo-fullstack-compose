import { ArrowRight, Check, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { errorMessage } from '../services/client'

export default function AuthForm() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const pending = login.isPending || register.isPending

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await register.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          password,
        })
      } else {
        await login.mutateAsync({ email: email.trim(), password })
      }
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
  }

  return (
    <main className="page-wrap grid gap-10 px-4 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pt-24">
      <section className="rise-in max-w-xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--palm)]">
          <Sparkles size={15} aria-hidden="true" /> Make room for what matters
        </div>
        <h1 className="display-title text-5xl leading-[1.06] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl lg:text-7xl">
          A clearer day
          <br />
          starts <span className="text-[var(--lagoon-deep)]">here.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-[var(--sea-ink-soft)]">
          Gather your thoughts, make a little progress, and enjoy the feeling of
          getting things done. Your space to focus is ready.
        </p>
        <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 text-sm font-semibold text-[var(--sea-ink-soft)]">
          <span className="flex items-center gap-2">
            <Check size={18} className="text-[var(--palm)]" /> Keep everything
            in one place
          </span>
          <span className="flex items-center gap-2">
            <Check size={18} className="text-[var(--palm)]" /> Pick up where you
            left off
          </span>
        </div>
      </section>

      <section
        className="island-shell rise-in rounded-[2rem] p-6 sm:p-9"
        aria-label="Account"
      >
        <fieldset className="mb-7 flex min-w-0 rounded-2xl bg-[var(--sand)] p-1">
          <legend className="sr-only">Account action</legend>
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-pressed={mode === 'login'}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold ${mode === 'login' ? 'bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-sm' : 'text-[var(--sea-ink-soft)]'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            aria-pressed={mode === 'register'}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold ${mode === 'register' ? 'bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-sm' : 'text-[var(--sea-ink-soft)]'}`}
          >
            Create account
          </button>
        </fieldset>

        <p className="island-kicker mb-2">Your workspace awaits</p>
        <h2 className="display-title mb-2 text-3xl font-bold text-[var(--sea-ink)]">
          {mode === 'login' ? 'Welcome back.' : 'Let’s get started.'}
        </h2>
        <p className="mb-7 text-sm text-[var(--sea-ink-soft)]">
          {mode === 'login'
            ? 'Sign in to see what’s on your list.'
            : 'Create an account to keep your todos in sync.'}
        </p>

        <form onSubmit={submit} className="space-y-5">
          {mode === 'register' && (
            <label className="block">
              <span className="form-label">Your name</span>
              <input
                className="form-input"
                type="text"
                autoComplete="name"
                maxLength={50}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="What should we call you?"
              />
            </label>
          )}
          <label className="block">
            <span className="form-label">
              <Mail size={15} aria-hidden="true" /> Email address
            </span>
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              maxLength={50}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="form-label">
              <LockKeyhole size={15} aria-hidden="true" /> Password
            </span>
            <input
              className="form-input"
              type="password"
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              minLength={8}
              maxLength={50}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          {error && (
            <p role="alert" className="error-note">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="primary-button w-full justify-center"
            disabled={pending}
          >
            {pending
              ? 'Just a moment…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            {!pending && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-[var(--sea-ink-soft)]">
          One small step toward a more organized day.
        </p>
      </section>
    </main>
  )
}
