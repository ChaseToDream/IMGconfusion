import { useState, useEffect, useCallback } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={toggle}
      className="relative w-14 h-8 rounded-full transition-colors duration-300
                 bg-surface-200 dark:bg-surface-700
                 hover:bg-surface-300 dark:hover:bg-surface-600
                 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      aria-label={dark ? '切换亮色模式' : '切换暗色模式'}
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300
                    flex items-center justify-center text-xs
                    ${dark
                      ? 'translate-x-6 bg-surface-800 text-accent-400'
                      : 'translate-x-0 bg-white text-accent-500 shadow-sm'
                    }`}
      >
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
