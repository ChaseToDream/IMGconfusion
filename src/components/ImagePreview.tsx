interface ImagePreviewProps {
  originalUrl: string | null
  processedUrl: string | null
  originalName?: string
  processedName?: string
}

export function ImagePreview({ originalUrl, processedUrl, originalName, processedName }: ImagePreviewProps) {
  if (!originalUrl && !processedUrl) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
      {originalUrl && (
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-surface-900/50 dark:text-surface-100/50">
            原始图片{originalName ? ` · ${originalName}` : ''}
          </p>
          <div className="relative rounded-2xl overflow-hidden
                         bg-surface-100 dark:bg-surface-700/40
                         border border-surface-200/60 dark:border-surface-700/40
                         ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.03]">
            <img
              src={originalUrl}
              alt="原始图片"
              className="w-full h-auto max-h-80 object-contain"
            />
          </div>
        </div>
      )}
      {processedUrl && (
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-surface-900/50 dark:text-surface-100/50">
            处理结果{processedName ? ` · ${processedName}` : ''}
          </p>
          <div className="relative rounded-2xl overflow-hidden
                         bg-surface-100 dark:bg-surface-700/40
                         border border-surface-200/60 dark:border-surface-700/40
                         ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.03]">
            <img
              src={processedUrl}
              alt="处理结果"
              className="w-full h-auto max-h-80 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
