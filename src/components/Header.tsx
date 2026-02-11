import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
        <Link
          to="/"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors [&.active]:text-indigo-600"
        >
          Dashboard
        </Link>
        <Link
          to="/expenses"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors [&.active]:text-indigo-600"
        >
          Expenses
        </Link>
      </nav>
    </header>
  )
}
