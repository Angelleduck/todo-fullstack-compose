import { Link } from '@tanstack/react-router'
import { CheckCheck } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav
        className="page-wrap flex items-center justify-between gap-4 py-3 sm:py-4"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-[var(--sea-ink)] no-underline"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--palm)] text-white">
            <CheckCheck size={22} aria-hidden="true" />
          </span>
          daylist<span className="text-[var(--lagoon-deep)]">.</span>
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  )
}
