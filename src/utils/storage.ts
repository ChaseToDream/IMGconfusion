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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // storage full, clear old entries
    history.splice(MAX_HISTORY / 2)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }
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
