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
        relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer
        transition-all duration-300 ease-in-out group
        ${isDragging
          ? 'border-primary-400 dark:border-primary-400 bg-primary-50 dark:bg-primary-500/10 scale-[1.01]'
          : 'border-surface-300 dark:border-surface-700/60 hover:border-primary-300 dark:hover:border-primary-500/50 bg-surface-50/50 dark:bg-surface-800/30 hover:bg-primary-50/30 dark:hover:bg-primary-500/5'
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
      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isDragging
                          ? 'bg-primary-100 dark:bg-primary-500/20'
                          : 'bg-surface-100 dark:bg-surface-700/50 group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10'
                        }`}>
          <svg className={`w-8 h-8 transition-colors duration-300
                          ${isDragging
                            ? 'text-primary-500 dark:text-primary-400'
                            : 'text-surface-900/30 dark:text-surface-100/30 group-hover:text-primary-500 dark:group-hover:text-primary-400'
                          }`}
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className={`text-lg font-semibold transition-colors duration-300
                        ${isDragging
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-surface-900/70 dark:text-surface-100/70'
                        }`}>
            {isDragging ? '松开以上传图片' : '拖放图片到此处'}
          </p>
          <p className="text-sm text-surface-900/35 dark:text-surface-100/35 mt-1.5">
            或点击选择文件 · 支持 PNG / JPG / WebP
          </p>
        </div>
      </div>
    </div>
  )
}
