export interface ImageProcessingRequest {
  imageData: ImageData
  key: string
  mode: 'obfuscate' | 'restore'
  algorithmId: string
}

export interface ImageProcessingResult {
  processedData: ImageData
  originalWidth: number
  originalHeight: number
  metadata?: Record<string, string>
}

export interface ProcessingProgress {
  phase: string
  current: number
  total: number
  percent: number
}

export interface AlgorithmInfo {
  id: string
  name: string
  description: string
}

export interface HistoryEntry {
  id: string
  filename: string
  mode: 'obfuscate' | 'restore'
  algorithmId: string
  timestamp: number
  thumbnailUrl: string
}
