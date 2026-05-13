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
      className="relative w-14 h-8 rounded-full transition-all duration-300
                 focus:outline-none focus:ring-2 focus:ring-primary-500/20
                 group"
      style={{
        background: dark
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        boxShadow: dark
          ? 'inset 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)'
          : 'inset 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(99,102,241,0.1)',
      }}
      aria-label={dark ? '切换亮色模式' : '切换暗色模式'}
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300
                    flex items-center justify-center text-xs
                    ${dark
                      ? 'translate-x-6'
                      : 'translate-x-0'
                    }`}
        style={{
          background: dark
            ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: dark
            ? '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
