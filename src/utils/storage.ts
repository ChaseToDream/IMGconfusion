import type { HistoryEntry } from '../types'
import { generateId } from './imageUtils'

const STORAGE_KEY = 'img-confusion-history'
const MAX_HISTORY = 20

export function getHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 渐进式写入：当 localStorage 配额不足时，逐步裁剪历史条目直至可写入
 * 避免单次裁剪后仍超出配额导致写入失败、当前记录丢失
 */
function persistWithProgressiveTrim(history: HistoryEntry[]): boolean {
  // 先尝试完整写入
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return true
  } catch {
    // 配额不足，进入渐进裁剪
  }

  const clone = [...history]
  // 逐步减半直到能写入或仅剩当前条目
  while (clone.length > 1) {
    clone.splice(Math.ceil(clone.length / 2))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clone))
      return true
    } catch {
      // 继续裁剪
    }
  }
  // 极端情况：仅保留最新一条，且去掉缩略图
  if (clone.length >= 1) {
    try {
      const minimal = [{ ...clone[0], thumbnailUrl: '' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
      return true
    } catch {
      return false
    }
  }
  return false
}

export function addHistory(
  filename: string,
  mode: 'obfuscate' | 'restore',
  algorithmId: string,
  thumbnailUrl: string
): HistoryEntry {
  const history = getHistory()
  const entry: HistoryEntry = {
    id: generateId(),
    filename,
    mode,
    algorithmId,
    timestamp: Date.now(),
    thumbnailUrl,
  }
  history.unshift(entry)
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY)
  }
  persistWithProgressiveTrim(history)
  return entry
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
