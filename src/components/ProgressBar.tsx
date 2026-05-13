import type { ProcessingProgress } from '../types'

interface ProgressBarProps {
  progress: ProcessingProgress | null
}

export function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) return null

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex justify-between text-sm">
        <span className="text-surface-900/50 dark:text-surface-100/50 font-medium">
          {progress.phase}
        </span>
        <span className="font-mono font-semibold tabular-nums text-primary-600 dark:text-primary-400">
          {progress.percent}%
        </span>
      </div>
      <div className="h-2 bg-surface-100/80 dark:bg-surface-700/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full relative transition-all duration-500 ease-out overflow-hidden"
          style={{
            width: `${progress.percent}%`,
            background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 40%, #06b6d4 100%)',
          }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
