/**
 * Game domain types, persistence helpers, and pure scoring rules (no UI).
 */

export type LetterFeedback = 'correct' | 'present' | 'absent'

/** Tracks best-known status per keyboard letter after guesses. */
export type KeyKnowledge = 'correct' | 'present' | 'absent' | 'unknown'

export interface PersistedGameState {
  version: 1
  dayKey: string
  guesses: string[]
  outcome: 'playing' | 'won' | 'lost'
}

export const STORAGE_PREFIX = 'filipino-wordle-v1'

export function storageKeyForDay(dayKey: string): string {
  return `${STORAGE_PREFIX}:${dayKey}`
}

/**
 * Calendar day in the user's local timezone. Used for the daily word and save slot.
 */
export function getLocalDayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function loadPersisted(dayKey: string): PersistedGameState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKeyForDay(dayKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedGameState
    if (parsed.version !== 1 || parsed.dayKey !== dayKey) return null
    return parsed
  } catch {
    return null
  }
}

export function savePersisted(state: PersistedGameState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKeyForDay(state.dayKey), JSON.stringify(state))
  } catch {
    // Quota or private mode — game still works in-memory.
  }
}

/**
 * Wordle-style scoring: first lock greens, then assign yellows with remaining letter counts.
 */
export function scoreGuess(secret: string, guess: string): LetterFeedback[] {
  const s = secret.toUpperCase()
  const g = guess.toUpperCase()
  const result: LetterFeedback[] = Array(5).fill('absent')
  const remaining = new Map<string, number>()

  for (const ch of s) {
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1)
  }

  for (let i = 0; i < 5; i++) {
    if (g[i] === s[i]) {
      result[i] = 'correct'
      remaining.set(g[i], (remaining.get(g[i]) ?? 0) - 1)
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    const ch = g[i]
    const left = remaining.get(ch) ?? 0
    if (left > 0) {
      result[i] = 'present'
      remaining.set(ch, left - 1)
    }
  }

  return result
}

/**
 * Build keyboard highlight map: correct beats present beats absent.
 */
export function foldKeyboard(
  guesses: string[],
  feedbackByRow: LetterFeedback[][],
): Record<string, KeyKnowledge> {
  const acc: Record<string, KeyKnowledge> = {}

  for (let r = 0; r < guesses.length; r++) {
    const word = guesses[r]
    const row = feedbackByRow[r]
    for (let i = 0; i < 5; i++) {
      const letter = word[i]
      const fb = row[i]
      if (fb === 'correct') {
        acc[letter] = 'correct'
      } else if (fb === 'present') {
        if (acc[letter] !== 'correct') acc[letter] = 'present'
      } else {
        if (acc[letter] !== 'correct' && acc[letter] !== 'present') {
          acc[letter] = 'absent'
        }
      }
    }
  }

  return acc
}
