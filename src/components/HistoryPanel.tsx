import { useState, useCallback } from 'react'
import { getHistory, clearHistory } from '../utils/storage'
import type { HistoryEntry } from '../types'

interface HistoryPanelProps {
  onEntryClick?: (entry: HistoryEntry) => void
}

export function HistoryPanel({ onEntryClick }: HistoryPanelProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory())

  const refresh = useCallback(() => {
    setEntries(getHistory())
  }, [])

  const handleClear = useCallback(() => {
    clearHistory()
    setEntries([])
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) refresh()
      return !prev
    })
  }, [refresh])

  if (entries.length === 0 && !open) return null

  const modeLabel = (m: string) => m === 'obfuscate' ? '混淆' : '还原'
  const algoLabel = (id: string) => {
    if (id === 'channel-shuffle') return '通道洗牌'
    return '像素洗牌'
  }

  return (
    <div className="card">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between text-sm font-semibold
                   text-surface-900/60 dark:text-surface-100/60"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          处理历史
          {entries.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md
                           bg-primary-50 dark:bg-primary-500/10
                           text-primary-600 dark:text-primary-400">
              {entries.length}
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-2 animate-slide-up">
          {entries.length === 0 ? (
            <p className="text-xs text-surface-900/30 dark:text-surface-100/30 text-center py-4">
              暂无处理记录
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onEntryClick?.(entry)}
                    className="flex items-center gap-3 p-2.5 rounded-xl
                             bg-surface-50 dark:bg-surface-700/30
                             border border-surface-200/50 dark:border-surface-700/30
                             hover:bg-surface-100 dark:hover:bg-surface-700/50
                             transition-colors duration-150 cursor-pointer"
                  >
                    <img
                      src={entry.thumbnailUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0
                               border border-surface-200/50 dark:border-surface-700/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-900/70 dark:text-surface-100/70 truncate">
                        {entry.filename}
                      </p>
                      <p className="text-[10px] text-surface-900/35 dark:text-surface-100/35 mt-0.5">
                        {modeLabel(entry.mode)} · {algoLabel(entry.algorithmId)} · {new Date(entry.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0
                                   ${entry.mode === 'obfuscate'
                                     ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400'
                                     : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                   }`}>
                      {modeLabel(entry.mode)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleClear}
                className="w-full text-xs text-surface-900/30 dark:text-surface-100/30
                         hover:text-red-500 dark:hover:text-red-400
                         transition-colors duration-200 py-2"
              >
                清空历史记录
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
