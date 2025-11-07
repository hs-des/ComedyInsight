import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-primary/60 hover:text-white"
    >
      {isDark ? <Sun size={14} /> : <MoonStar size={14} />}
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

