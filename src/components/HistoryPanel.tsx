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
                   text-surface-900/70 dark:text-surface-100/70 group"
      >
        <span className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          处理历史
          {entries.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md
                           bg-primary-50 dark:bg-primary-500/10
                           text-primary-600 dark:text-primary-400">
              {entries.length}
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 transition-transform duration-300 text-surface-900/30 dark:text-surface-100/30
                        group-hover:text-surface-900/50 dark:group-hover:text-surface-100/50
                        ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-5 space-y-2.5 animate-slide-up">
          {entries.length === 0 ? (
            <p className="text-xs text-surface-900/30 dark:text-surface-100/30 text-center py-6">
              暂无处理记录
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onEntryClick?.(entry)}
                    className="flex items-center gap-3 p-3 rounded-xl
                             bg-surface-50/60 dark:bg-surface-700/20
                             border border-surface-200/40 dark:border-surface-700/25
                             hover:bg-surface-100/80 dark:hover:bg-surface-700/35
                             hover:border-surface-200/60 dark:hover:border-surface-700/40
                             transition-all duration-200 cursor-pointer group/item"
                  >
                    <img
                      src={entry.thumbnailUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0
                               border border-surface-200/50 dark:border-surface-700/30
                               group-hover/item:border-primary-300/50 dark:group-hover/item:border-primary-500/30
                               transition-colors duration-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-900/70 dark:text-surface-100/70 truncate
                                  group-hover/item:text-surface-900/90 dark:group-hover/item:text-surface-100/90
                                  transition-colors duration-200">
                        {entry.filename}
                      </p>
                      <p className="text-[10px] text-surface-900/35 dark:text-surface-100/35 mt-0.5">
                        {modeLabel(entry.mode)} · {algoLabel(entry.algorithmId)} · {new Date(entry.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0
                                   ${entry.mode === 'obfuscate'
                                     ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400'
                                     : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                         transition-colors duration-200 py-2.5 rounded-lg
                         hover:bg-red-50/50 dark:hover:bg-red-500/5"
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
