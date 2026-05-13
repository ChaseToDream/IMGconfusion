import { useState } from 'react'

interface KeyInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

export function KeyInput({ value, onChange, disabled = false, label = '加密密钥' }: KeyInputProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold
                        text-surface-900/70 dark:text-surface-100/70">
        {label}
        <span className="text-surface-900/25 dark:text-surface-100/25 text-xs font-normal">（可选）</span>
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-900/20 dark:text-surface-100/20
                       group-focus-within:text-primary-400 dark:group-focus-within:text-primary-500 transition-colors duration-300">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="留空则使用默认密钥，设置后还原时需相同密钥"
          className="input-field pl-10 pr-12"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2
                     text-surface-900/25 dark:text-surface-100/25
                     hover:text-primary-500 dark:hover:text-primary-400
                     transition-colors duration-200 p-0.5"
          tabIndex={-1}
        >
          {showKey ? (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {value.length > 0 && value.length < 4 && (
        <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1.5 animate-slide-up">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          密钥过短，建议至少4个字符以提高安全性
        </p>
      )}
    </div>
  )
}
