import type { ProcessingProgress } from '../types'

interface ProgressBarProps {
  progress: ProcessingProgress | null
}

export function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) return null

  return (
    <div className="space-y-2.5 animate-slide-up">
      <div className="flex justify-between text-sm">
        <span className="text-surface-900/50 dark:text-surface-100/50 font-medium">
          {progress.phase}
        </span>
        <span className="text-primary-500 dark:text-primary-400 font-mono font-medium tabular-nums">
          {progress.percent}%
        </span>
      </div>
      <div className="h-2.5 bg-surface-100 dark:bg-surface-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out
                     bg-gradient-to-r from-primary-500 via-primary-400 to-accent-400
                     dark:from-primary-600 dark:via-primary-500 dark:to-accent-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
}
