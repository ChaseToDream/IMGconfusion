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
      <div className="absolute inset-0 bg-surface-900/30 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative rounded-3xl p-7 max-w-sm w-full animate-scale-in
                      bg-white dark:bg-surface-800
                      border border-surface-200/60 dark:border-surface-700/40
                      shadow-2xl shadow-black/10 dark:shadow-black/40">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
        <p className="text-surface-900/55 dark:text-surface-100/55 text-sm leading-relaxed mb-7">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm px-5 py-2.5">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger text-sm px-5 py-2.5' : 'btn-primary text-sm px-5 py-2.5'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
