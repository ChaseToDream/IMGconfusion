interface ImagePreviewProps {
  originalUrl: string | null
  processedUrl: string | null
  originalName?: string
  processedName?: string
}

export function ImagePreview({ originalUrl, processedUrl, originalName, processedName }: ImagePreviewProps) {
  if (!originalUrl && !processedUrl) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-up">
      {originalUrl && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-surface-900/50 dark:text-surface-100/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500" />
            原始图片{originalName ? ` · ${originalName}` : ''}
          </p>
          <div className="relative rounded-2xl overflow-hidden
                         bg-surface-50/80 dark:bg-surface-800/40
                         border border-surface-200/50 dark:border-surface-700/30
                         p-2">
            <img
              src={originalUrl}
              alt="原始图片"
              className="w-full h-auto max-h-80 object-contain rounded-xl"
            />
          </div>
        </div>
      )}
      {processedUrl && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-surface-900/50 dark:text-surface-100/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            处理结果{processedName ? ` · ${processedName}` : ''}
          </p>
          <div className="relative rounded-2xl overflow-hidden
                         bg-surface-50/80 dark:bg-surface-800/40
                         border border-surface-200/50 dark:border-surface-700/30
                         p-2">
            <img
              src={processedUrl}
              alt="处理结果"
              className="w-full h-auto max-h-80 object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
