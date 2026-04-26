import { obfuscatePixels, restorePixels } from '../algorithms/shuffle'

interface WorkerMessage {
  type: 'process'
  data: Uint8ClampedArray
  width: number
  height: number
  key: string
  mode: 'obfuscate' | 'restore'
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error'
  percent?: number
  data?: Uint8ClampedArray
  error?: string
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { data, width, height, key, mode } = e.data

  try {
    const processFn = mode === 'obfuscate' ? obfuscatePixels : restorePixels
    const result = processFn(data, width, height, key, (percent: number) => {
      const response: WorkerResponse = { type: 'progress', percent }
      self.postMessage(response)
    })

    const response: WorkerResponse = { type: 'complete', data: result }
    ;(self as unknown as Worker).postMessage(response, [result.buffer] as Transferable[])
  } catch (err) {
    const response: WorkerResponse = {
      type: 'error',
      error: err instanceof Error ? err.message : '处理失败',
    }
    self.postMessage(response)
  }
}
