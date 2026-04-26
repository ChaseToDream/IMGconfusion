import { useState, useCallback, useRef } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { KeyInput } from './components/KeyInput'
import { ProgressBar } from './components/ProgressBar'
import { ImagePreview } from './components/ImagePreview'
import { ConfirmDialog } from './components/ConfirmDialog'
import { loadImage, imageToImageData, imageDataToBlob, createThumbnail, formatFileSize } from './utils/imageUtils'
import { insertPngTextChunk, extractJpegExif, uint8ArrayToBase64 } from './utils/pngChunks'
import { addHistory, isStorageAvailable } from './utils/storage'
import type { ProcessingProgress } from './types'

type Mode = 'obfuscate' | 'restore'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
}

export default function App() {
  const [mode, setMode] = useState<Mode>('obfuscate')
  const [file, setFile] = useState<File | null>(null)
  const [key, setKey] = useState('')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} })
  const workerRef = useRef<Worker | null>(null)

  const resetState = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) URL.revokeObjectURL(processedUrl)
    setFile(null)
    setKey('')
    setOriginalUrl(null)
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProgress(null)
    setError(null)
  }, [originalUrl, processedUrl])

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) URL.revokeObjectURL(processedUrl)
    setFile(selectedFile)
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProgress(null)
    setError(null)
    const url = URL.createObjectURL(selectedFile)
    setOriginalUrl(url)
  }, [originalUrl, processedUrl])

  const readFileAsUint8Array = useCallback((f: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(f)
    })
  }, [])

  const processImage = useCallback(async () => {
    if (!file || !key) return

    setProcessing(true)
    setError(null)
    setProgress({ phase: mode === 'obfuscate' ? '正在混淆...' : '正在还原...', current: 0, total: 100, percent: 0 })

    try {
      const img = await loadImage(file)
      const imageData = imageToImageData(img)
      const rawFileData = await readFileAsUint8Array(file)

      if (workerRef.current) {
        workerRef.current.terminate()
      }

      const worker = new Worker(
        new URL('./workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker

      const resultPromise = new Promise<Uint8ClampedArray>((resolve, reject) => {
        worker.onmessage = (e) => {
          const { type, percent, data, error: workerError } = e.data
          if (type === 'progress') {
            setProgress({
              phase: mode === 'obfuscate' ? '正在混淆...' : '正在还原...',
              current: percent!,
              total: 100,
              percent: percent!,
            })
          } else if (type === 'complete') {
            resolve(data)
          } else if (type === 'error') {
            reject(new Error(workerError))
          }
        }
        worker.onerror = (e) => reject(new Error(e.message))
      })

      worker.postMessage({
        type: 'process',
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
        key,
        mode,
      })

      const resultData = await resultPromise
      worker.terminate()
      workerRef.current = null

      const resultBuffer = new Uint8ClampedArray(resultData).buffer
      const resultImageData = new ImageData(
        new Uint8ClampedArray(resultBuffer),
        imageData.width,
        imageData.height
      )

      let blob = await imageDataToBlob(resultImageData)

      if (mode === 'obfuscate') {
        setProgress({ phase: '正在嵌入元数据...', current: 99, total: 100, percent: 99 })

        const pngData = new Uint8Array(await blob.arrayBuffer())
        const metadata: Record<string, string> = {
          originalName: file.name,
          originalType: file.type,
          originalSize: String(file.size),
          width: String(imageData.width),
          height: String(imageData.height),
        }

        const exifData = extractJpegExif(rawFileData)
        if (exifData) {
          metadata.exif = uint8ArrayToBase64(exifData)
        }

        const pngWithMeta = insertPngTextChunk(pngData, 'imgconfusion', JSON.stringify(metadata))
        const metaBuffer = new ArrayBuffer(pngWithMeta.byteLength)
        new Uint8Array(metaBuffer).set(pngWithMeta)
        blob = new Blob([metaBuffer], { type: 'image/png' })
      }

      setProcessedBlob(blob)

      if (processedUrl) URL.revokeObjectURL(processedUrl)
      const url = URL.createObjectURL(blob)
      setProcessedUrl(url)

      setProgress({
        phase: mode === 'obfuscate' ? '混淆完成' : '还原完成',
        current: 100,
        total: 100,
        percent: 100,
      })

      if (isStorageAvailable()) {
        try {
          const thumb = createThumbnail(img)
          addHistory(file.name, mode, 'pixel-shuffle', thumb)
        } catch { /* ignore thumbnail errors */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试')
      setProgress(null)
    } finally {
      setProcessing(false)
    }
  }, [file, key, mode, processedUrl, readFileAsUint8Array])

  const handleProcessClick = useCallback(() => {
    if (!file) {
      setError('请先选择图片')
      return
    }
    if (!key) {
      setError('请输入密钥')
      return
    }

    const actionText = mode === 'obfuscate' ? '混淆' : '还原'
    setConfirm({
      open: true,
      title: `确认${actionText}`,
      message: mode === 'obfuscate'
        ? '混淆后的图片将无法被人眼识别，请务必牢记密钥，丢失密钥将无法还原！'
        : '请确保使用与混淆时相同的密钥，密钥错误将产生错误的还原结果。',
      onConfirm: () => {
        setConfirm((prev) => ({ ...prev, open: false }))
        processImage()
      },
    })
  }, [file, key, mode, processImage])

  const handleDownload = useCallback(() => {
    if (!processedBlob || !file) return
    const ext = 'png'
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const suffix = mode === 'obfuscate' ? '_confused' : '_restored'
    const filename = `${baseName}${suffix}.${ext}`

    const a = document.createElement('a')
    a.href = URL.createObjectURL(processedBlob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }, [processedBlob, file, mode])

  const switchMode = useCallback((newMode: Mode) => {
    if (processing) return
    setMode(newMode)
    resetState()
  }, [processing, resetState])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">IMG Confusion</h1>
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">纯客户端 · 隐私安全</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => switchMode('obfuscate')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'obfuscate'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔒 图片混淆
          </button>
          <button
            onClick={() => switchMode('restore')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'restore'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔑 图片还原
          </button>
        </div>

        <div className="card space-y-5">
          <ImageUploader onFileSelect={handleFileSelect} disabled={processing} />

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg px-4 py-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{file.name}</span>
              <span className="text-gray-600">·</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          )}

          <KeyInput
            value={key}
            onChange={setKey}
            disabled={processing}
            label={mode === 'obfuscate' ? '加密密钥' : '还原密钥'}
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <ProgressBar progress={progress} />

          <div className="flex gap-3">
            <button
              onClick={handleProcessClick}
              disabled={processing || !file || !key}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  处理中...
                </>
              ) : (
                mode === 'obfuscate' ? '开始混淆' : '开始还原'
              )}
            </button>
            {processedBlob && (
              <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载
              </button>
            )}
          </div>
        </div>

        <ImagePreview
          originalUrl={originalUrl}
          processedUrl={processedUrl}
          originalName={file?.name}
          processedName={processedBlob ? (mode === 'obfuscate' ? '混淆结果' : '还原结果') : undefined}
        />

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-3">使用说明</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">1</span>
              <span>选择「混淆」模式，上传图片并输入密钥</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">2</span>
              <span>点击混淆，下载混淆后的图片</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">3</span>
              <span>选择「还原」模式，上传混淆图片</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">4</span>
              <span>输入相同密钥，点击还原图片</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            ⚠️ 所有处理均在本地浏览器完成，图片不会上传至任何服务器。请妥善保管密钥，丢失密钥将无法还原图片。
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        IMG Confusion · 纯客户端图片混淆工具 · MIT License
      </footer>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="确认执行"
        variant={mode === 'obfuscate' ? 'danger' : 'default'}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
