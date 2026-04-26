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
        relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragging
          ? 'border-primary-400 bg-primary-400/10 scale-[1.02]'
          : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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
      <div className="flex flex-col items-center gap-3">
        <svg className={`w-12 h-12 ${isDragging ? 'text-primary-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div>
          <p className="text-lg font-medium text-gray-300">
            {isDragging ? '松开以上传图片' : '拖放图片到此处'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            或点击选择文件 · 支持 PNG / JPG / WebP
          </p>
        </div>
      </div>
    </div>
  )
}
