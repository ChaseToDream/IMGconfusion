interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-surface-900/20 dark:bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <div className="relative rounded-3xl p-8 max-w-sm w-full animate-scale-in
                      bg-white/95 dark:bg-surface-800/95
                      border border-surface-200/60 dark:border-surface-700/50
                      backdrop-blur-xl"
           style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.05)' }}>
        <div className="mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5
                          ${variant === 'danger'
                            ? 'bg-red-50 dark:bg-red-500/10'
                            : 'bg-primary-50 dark:bg-primary-500/10'
                          }`}>
            {variant === 'danger' ? (
              <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
          <p className="text-surface-900/55 dark:text-surface-100/55 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-3">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${variant === 'danger' ? 'btn-danger' : 'btn-primary'} flex-1 text-sm py-3`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
