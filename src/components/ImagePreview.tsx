interface ImagePreviewProps {
  originalUrl: string | null
  processedUrl: string | null
  originalName?: string
  processedName?: string
}

export function ImagePreview({ originalUrl, processedUrl, originalName, processedName }: ImagePreviewProps) {
  if (!originalUrl && !processedUrl) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {originalUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 font-medium">
            原始图片{originalName ? ` · ${originalName}` : ''}
          </p>
          <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <img
              src={originalUrl}
              alt="原始图片"
              className="w-full h-auto max-h-80 object-contain"
            />
          </div>
        </div>
      )}
      {processedUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 font-medium">
            处理结果{processedName ? ` · ${processedName}` : ''}
          </p>
          <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
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
