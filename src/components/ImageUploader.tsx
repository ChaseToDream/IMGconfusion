import { useState, useRef, useCallback } from 'react'

interface ImageUploaderProps {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
}

export function ImageUploader({ onFileSelect, accept = 'image/*', disabled = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }, [disabled, onFileSelect])

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative rounded-3xl p-8 md:p-12 text-center cursor-pointer
        transition-all duration-300 ease-out group overflow-hidden
        ${isDragging
          ? 'border-2 border-primary-400 dark:border-primary-400 bg-primary-50/60 dark:bg-primary-500/8 scale-[1.01]'
          : 'border-2 border-dashed border-surface-300/80 dark:border-surface-700/50 hover:border-primary-300/70 dark:hover:border-primary-500/40 bg-surface-50/30 dark:bg-surface-800/15 hover:bg-primary-50/20 dark:hover:bg-primary-500/3'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5" />
        </div>
      )}
      <div className="relative flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isDragging
                          ? 'bg-primary-100/80 dark:bg-primary-500/15 scale-110'
                          : 'bg-surface-100/80 dark:bg-surface-700/40 group-hover:bg-primary-50/80 dark:group-hover:bg-primary-500/10 group-hover:scale-105'
                        }`}>
          <svg className={`w-8 h-8 transition-all duration-300
                          ${isDragging
                            ? 'text-primary-500 dark:text-primary-400'
                            : 'text-surface-900/25 dark:text-surface-100/25 group-hover:text-primary-400 dark:group-hover:text-primary-400'
                          }`}
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className={`text-base font-semibold transition-colors duration-300
                        ${isDragging
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-surface-900/60 dark:text-surface-100/60'
                        }`}>
            {isDragging ? '松开以上传图片' : '拖放图片到此处'}
          </p>
          <p className="text-sm text-surface-900/30 dark:text-surface-100/30 mt-1.5">
            或点击选择文件 · 支持 PNG / JPG / WebP
          </p>
        </div>
      </div>
    </div>
  )
}
