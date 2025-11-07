import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('admin-theme') as Theme) || 'dark'
  })
  const [isDark, setIsDark] = useState<boolean>(() => (theme === 'system' ? prefersDark() : theme === 'dark'))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        setIsDark(media.matches)
      }
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  useEffect(() => {
    const resolved = theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
    setIsDark(resolved === 'dark')
    document.documentElement.dataset.theme = resolved
    localStorage.setItem('admin-theme', theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: isDark ? 'dark' : 'light',
      setTheme: setThemeState,
      toggleTheme: () => {
        setThemeState((prev) => {
          if (prev === 'system') {
            return prefersDark() ? 'light' : 'dark'
          }
          return prev === 'dark' ? 'light' : 'dark'
        })
      },
    }),
    [theme, isDark]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

