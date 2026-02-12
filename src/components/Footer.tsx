export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>&copy; {year} Expense Tracker</p>
        <p>Track smarter, spend wiser.</p>
      </div>
    </footer>
  )
}
