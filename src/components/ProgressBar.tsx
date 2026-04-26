import type { ProcessingProgress } from '../types'

interface ProgressBarProps {
  progress: ProcessingProgress | null
}

export function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) return null

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{progress.phase}</span>
        <span className="text-primary-400 font-mono">{progress.percent}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
}
