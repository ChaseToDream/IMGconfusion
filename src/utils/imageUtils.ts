import type { ProcessingProgress } from '../types'

/**
 * 将文件加载为 Image 对象
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}

/**
 * 从 Image 对象获取 ImageData
 */
export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * 将 ImageData 转换为 Blob（PNG 格式）
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片导出失败'))
      },
      'image/png'
    )
  })
}

/**
 * 创建图片缩略图 DataURL
 * 使用 JPEG 压缩以显著减小 localStorage 占用（相比 PNG 体积约缩小 5~10 倍）
 */
export function createThumbnail(img: HTMLImageElement, maxSize = 120): string {
  const canvas = document.createElement('canvas')
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1)
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  // 不透明背景以兼容 JPEG（避免透明区域变黑）
  if (img.naturalWidth > 0) {
    const tmp = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 3; i < tmp.data.length; i += 4) {
      if (tmp.data[i] < 255) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        break
      }
    }
  }
  return canvas.toDataURL('image/jpeg', 0.6)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * 算法内存估算系数（每像素字节数）
 * - pixel-shuffle: src(4) + dst(4) + permutation(4) ≈ 12
 * - channel-shuffle: src(4) + dst(4) + 3*permutation(12) ≈ 20
 */
export const MEMORY_BYTES_PER_PIXEL: Record<string, number> = {
  'pixel-shuffle': 12,
  'channel-shuffle': 20,
}

/** 触发警告的内存阈值（约 384MB，对应 4K 图像素洗牌） */
export const MEMORY_WARN_THRESHOLD = 384 * 1024 * 1024
/** 拒绝处理的内存阈值（约 768MB，避免浏览器崩溃） */
export const MEMORY_HARD_LIMIT = 768 * 1024 * 1024

/**
 * 估算处理指定图片所需内存（字节）
 */
export function estimateProcessingMemory(
  width: number,
  height: number,
  algorithmId: string
): number {
  const perPixel = MEMORY_BYTES_PER_PIXEL[algorithmId] ?? 16
  return width * height * perPixel
}

/**
 * 创建进度对象
 */
export function createProgress(
  phase: string,
  current: number,
  total: number
): ProcessingProgress {
  return {
    phase,
    current,
    total,
    percent: Math.round((current / total) * 100),
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
