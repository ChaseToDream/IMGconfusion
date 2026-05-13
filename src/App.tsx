import { useState, useCallback, useRef, useEffect } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { KeyInput } from './components/KeyInput'
import { ProgressBar } from './components/ProgressBar'
import { ImagePreview } from './components/ImagePreview'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ThemeToggle } from './components/ThemeToggle'
import { HistoryPanel } from './components/HistoryPanel'
import { loadImage, imageToImageData, imageDataToBlob, createThumbnail, formatFileSize } from './utils/imageUtils'
import { insertPngTextChunk, readPngTextChunk, extractJpegExif, uint8ArrayToBase64, base64ToUint8Array, insertJpegExifIntoPng } from './utils/pngChunks'
import { addHistory, isStorageAvailable } from './utils/storage'
import { algorithms } from './algorithms'
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
  const [algorithmId, setAlgorithmId] = useState('pixel-shuffle')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} })
  const [restoredMeta, setRestoredMeta] = useState<Record<string, string> | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const [isGlobalDrag, setIsGlobalDrag] = useState(false)

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) {
        setIsGlobalDrag(true)
      }
    }
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setIsGlobalDrag(false)
      }
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsGlobalDrag(false)
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  const resetState = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) URL.revokeObjectURL(processedUrl)
    setFile(null)
    setKey('')
    setAlgorithmId('pixel-shuffle')
    setOriginalUrl(null)
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProgress(null)
    setError(null)
    setRestoredMeta(null)
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
    if (!file) return

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
        algorithmId,
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
          algorithmId,
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

      if (mode === 'restore') {
        setProgress({ phase: '正在读取元数据...', current: 99, total: 100, percent: 99 })
        const pngData = new Uint8Array(await readFileAsUint8Array(file))
        const metaStr = readPngTextChunk(pngData, 'imgconfusion')
        if (metaStr) {
          try {
            const meta = JSON.parse(metaStr) as Record<string, string>
            setRestoredMeta(meta)

            if (meta.algorithmId) {
              setAlgorithmId(meta.algorithmId)
            }

            if (meta.exif) {
              try {
                const exifBytes = base64ToUint8Array(meta.exif)
                const pngResult = new Uint8Array(await blob.arrayBuffer())
                const exifApp1 = new Uint8Array(exifBytes.length)
                exifApp1.set(exifBytes)
                const withExif = insertJpegExifIntoPng(pngResult, exifApp1)
                if (withExif) {
                  const buf = new ArrayBuffer(withExif.byteLength)
                  new Uint8Array(buf).set(withExif)
                  blob = new Blob([buf], { type: 'image/png' })
                }
              } catch { /* ignore EXIF restore errors */ }
            }
          } catch { /* ignore metadata parse errors */ }
        }
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
          addHistory(file.name, mode, algorithmId, thumb)
        } catch { /* ignore thumbnail errors */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试')
      setProgress(null)
    } finally {
      setProcessing(false)
    }
  }, [file, key, mode, algorithmId, processedUrl, readFileAsUint8Array])

  const handleProcessClick = useCallback(() => {
    if (!file) {
      setError('请先选择图片')
      return
    }

    const actionText = mode === 'obfuscate' ? '混淆' : '还原'
    setConfirm({
      open: true,
      title: `确认${actionText}`,
      message: mode === 'obfuscate'
        ? key
          ? '混淆后的图片将无法被人眼识别，请务必牢记密钥，丢失密钥将无法还原！'
          : '未设置密钥，任何人使用本工具均可还原图片。建议设置密钥以提高安全性。'
        : key
          ? '请确保使用与混淆时相同的密钥，密钥错误将产生错误的还原结果。'
          : '该图片未使用密钥混淆，直接还原即可。',
      onConfirm: () => {
        setConfirm((prev) => ({ ...prev, open: false }))
        processImage()
      },
    })
  }, [file, key, mode, processImage])

  const handleDownload = useCallback(() => {
    if (!processedBlob || !file) return
    const ext = 'png'
    let baseName = file.name.replace(/\.[^.]+$/, '')
    if (mode === 'obfuscate') {
      const suffix = '_confused'
      const filename = `${baseName}${suffix}.${ext}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(processedBlob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } else {
      if (restoredMeta?.originalName) {
        baseName = restoredMeta.originalName.replace(/\.[^.]+$/, '')
      }
      const filename = `${baseName}_restored.${ext}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(processedBlob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }, [processedBlob, file, mode, restoredMeta])

  const switchMode = useCallback((newMode: Mode) => {
    if (processing) return
    setMode(newMode)
    resetState()
  }, [processing, resetState])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') switchMode('obfuscate')
      else if (e.key === '2') switchMode('restore')
      else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && file && !processing) {
        e.preventDefault()
        handleProcessClick()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [switchMode, file, processing, handleProcessClick])

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="mesh-gradient" />

      {isGlobalDrag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                       bg-primary-500/10 dark:bg-primary-500/5 backdrop-blur-sm
                       border-4 border-dashed border-primary-400 dark:border-primary-500
                       animate-fade-in pointer-events-none">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-primary-500 dark:text-primary-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">松开以上传图片</p>
          </div>
        </div>
      )}

      <header className="glass-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-md shadow-primary-500/20
                            dark:shadow-primary-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-surface-900 dark:text-white tracking-tight">
                IMG Confusion
              </h1>
              <p className="text-[10px] font-medium text-surface-900/30 dark:text-surface-100/30 tracking-wide uppercase hidden sm:block">
                Client-side · Privacy First
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-900/30 dark:text-surface-100/30 hidden md:block">
              纯客户端 · 隐私安全
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="mode-switch">
          <button
            onClick={() => switchMode('obfuscate')}
            className={`mode-btn ${mode === 'obfuscate' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
          >
            🔒 图片混淆
          </button>
          <button
            onClick={() => switchMode('restore')}
            className={`mode-btn ${mode === 'restore' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
          >
            🔑 图片还原
          </button>
        </div>

        <div className="card space-y-5">
          <ImageUploader onFileSelect={handleFileSelect} disabled={processing} />

          {file && (
            <div className="flex items-center gap-2.5 text-sm
                           bg-surface-50 dark:bg-surface-700/30
                           rounded-xl px-4 py-2.5
                           border border-surface-200/50 dark:border-surface-700/30
                           animate-slide-up">
              <svg className="w-4 h-4 flex-shrink-0 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate text-surface-900/70 dark:text-surface-100/70">{file.name}</span>
              <span className="text-surface-900/20 dark:text-surface-100/20">·</span>
              <span className="text-surface-900/40 dark:text-surface-100/40">{formatFileSize(file.size)}</span>
            </div>
          )}

          <KeyInput
            value={key}
            onChange={setKey}
            disabled={processing}
            label={mode === 'obfuscate' ? '加密密钥' : '还原密钥'}
          />

          {mode === 'obfuscate' && (
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-sm font-medium
                                text-surface-900/60 dark:text-surface-100/60">
                混淆算法
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {algorithms.map((algo) => (
                  <button
                    key={algo.id}
                    onClick={() => setAlgorithmId(algo.id)}
                    disabled={processing}
                    className={`text-left rounded-2xl px-4 py-3 transition-all duration-200 border
                              ${algorithmId === algo.id
                                ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-400/30 dark:ring-primary-500/30'
                                : 'border-surface-200 dark:border-surface-700/60 bg-surface-50 dark:bg-surface-700/30 hover:border-primary-300 dark:hover:border-primary-500/40'
                              }`}
                  >
                    <p className={`text-sm font-semibold ${algorithmId === algo.id ? 'text-primary-700 dark:text-primary-400' : 'text-surface-900/70 dark:text-surface-100/70'}`}>
                      {algo.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${algorithmId === algo.id ? 'text-primary-600/60 dark:text-primary-400/60' : 'text-surface-900/35 dark:text-surface-100/35'}`}>
                      {algo.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 text-sm
                           bg-red-50 dark:bg-red-500/10
                           text-red-600 dark:text-red-400
                           rounded-xl px-4 py-3
                           border border-red-200/50 dark:border-red-500/20
                           animate-slide-up">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <ProgressBar progress={progress} />

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleProcessClick}
              disabled={processing || !file}
              className="btn-primary flex-1 flex items-center justify-center gap-2.5 py-3.5"
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
                <>
                  {mode === 'obfuscate' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  )}
                  {mode === 'obfuscate' ? '开始混淆' : '开始还原'}
                </>
              )}
            </button>
            {processedBlob && (
              <button onClick={handleDownload} className="btn-secondary flex items-center gap-2 animate-scale-in">
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

        {mode === 'restore' && restoredMeta && (
          <div className="card animate-slide-up">
            <h3 className="text-sm font-semibold text-surface-900/60 dark:text-surface-100/60 mb-3">还原元数据</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {restoredMeta.originalName && (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-lg px-3 py-2">
                  <span className="text-surface-900/30 dark:text-surface-100/30">原始文件名</span>
                  <p className="text-surface-900/70 dark:text-surface-100/70 mt-0.5 truncate">{restoredMeta.originalName}</p>
                </div>
              )}
              {restoredMeta.originalType && (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-lg px-3 py-2">
                  <span className="text-surface-900/30 dark:text-surface-100/30">原始格式</span>
                  <p className="text-surface-900/70 dark:text-surface-100/70 mt-0.5">{restoredMeta.originalType}</p>
                </div>
              )}
              {restoredMeta.width && restoredMeta.height && (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-lg px-3 py-2">
                  <span className="text-surface-900/30 dark:text-surface-100/30">原始尺寸</span>
                  <p className="text-surface-900/70 dark:text-surface-100/70 mt-0.5">{restoredMeta.width} × {restoredMeta.height}</p>
                </div>
              )}
              {restoredMeta.originalSize && (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-lg px-3 py-2">
                  <span className="text-surface-900/30 dark:text-surface-100/30">原始大小</span>
                  <p className="text-surface-900/70 dark:text-surface-100/70 mt-0.5">{formatFileSize(Number(restoredMeta.originalSize))}</p>
                </div>
              )}
              {restoredMeta.exif && (
                <div className="col-span-2 bg-surface-50 dark:bg-surface-700/30 rounded-lg px-3 py-2">
                  <span className="text-surface-900/30 dark:text-surface-100/30">EXIF 数据</span>
                  <p className="text-surface-900/70 dark:text-surface-100/70 mt-0.5">✓ 已恢复原始 EXIF 信息</p>
                </div>
              )}
            </div>
          </div>
        )}

        <HistoryPanel />

        <div className="card">
          <h3 className="text-sm font-semibold text-surface-900/60 dark:text-surface-100/60 mb-4">使用说明</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-surface-900/40 dark:text-surface-100/40">
            {[
              '选择「混淆」模式，上传图片（可设置密钥）',
              '点击混淆，下载混淆后的图片',
              '选择「还原」模式，上传混淆图片',
              '输入相同密钥（若混淆时设置了），点击还原',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-primary-50 dark:bg-primary-500/10
                                text-primary-600 dark:text-primary-400
                                flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-200/50 dark:border-surface-700/30">
            <p className="text-xs text-surface-900/30 dark:text-surface-100/30 leading-relaxed">
              ⚠️ 所有处理均在本地浏览器完成，图片不会上传至任何服务器。设置密钥可提高安全性，丢失密钥将无法还原图片。
              <br />快捷键：按 1/2 切换模式，Ctrl+Enter 执行处理
            </p>
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-surface-900/20 dark:text-surface-100/20
                         border-t border-surface-200/30 dark:border-surface-700/20">
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
