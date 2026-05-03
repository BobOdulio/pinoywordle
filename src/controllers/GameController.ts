import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FILIPINO_WORDS,
  isAllowedGuess,
  MAX_ATTEMPTS,
  normalizeWord,
  WORD_LENGTH,
} from '../models/WordModel'
import {
  foldKeyboard,
  getLocalDayKey,
  loadPersisted,
  savePersisted,
  scoreGuess,
  storageKeyForDay,
} from '../models/GameModel'
import type { KeyKnowledge, LetterFeedback } from '../models/GameModel'

/**
 * Deterministic daily index: same calendar day + same word list ⇒ same word for all players.
 * Uses FNV-1a over the `YYYY-MM-DD` string so the choice is stable and evenly distributed.
 */
export function dailyWordIndex(dayKey: string, poolLength: number): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h % poolLength
}

export function secretForDay(dayKey: string): string {
  const idx = dailyWordIndex(dayKey, FILIPINO_WORDS.length)
  return FILIPINO_WORDS[idx]
}

export interface GridRowViewModel {
  /** Up to five typed letters for the active row; submitted rows always length 5. */
  letters: string
  feedback: LetterFeedback[] | null
  /** User is currently typing this row. */
  isTyping: boolean
}

function buildRows(
  guesses: string[],
  currentInput: string,
  outcome: 'playing' | 'won' | 'lost',
  secret: string,
): GridRowViewModel[] {
  const rows: GridRowViewModel[] = []
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i < guesses.length) {
      const g = guesses[i]
      rows.push({
        letters: g,
        feedback: scoreGuess(secret, g),
        isTyping: false,
      })
    } else if (i === guesses.length && outcome === 'playing') {
      rows.push({
        letters: currentInput,
        feedback: null,
        isTyping: true,
      })
    } else {
      rows.push({ letters: '', feedback: null, isTyping: false })
    }
  }
  return rows
}

export interface GameControllerState {
  dayKey: string
  secretWord: string
  rows: GridRowViewModel[]
  keyboard: Record<string, KeyKnowledge>
  currentInput: string
  outcome: 'playing' | 'won' | 'lost'
  toast: string | null
  shakeRowIndex: number | null
  /** Row index that should play flip reveal (last submission only). */
  animatingRowIndex: number | null
  canSubmit: boolean
  /** True after win/loss — show recap and block new guesses until tomorrow. */
  isDayComplete: boolean
}

export interface GameControllerActions {
  pushLetter: (letter: string) => void
  deleteLetter: () => void
  submitGuess: () => void
}

export type UseGameControllerReturn = GameControllerState & GameControllerActions

export function useGameController(): UseGameControllerReturn {
  const dayKey = useMemo(() => getLocalDayKey(), [])
  const secretWord = useMemo(() => secretForDay(dayKey), [dayKey])

  const [guesses, setGuesses] = useState<string[]>(() => {
    return loadPersisted(getLocalDayKey())?.guesses ?? []
  })
  const [outcome, setOutcome] = useState<'playing' | 'won' | 'lost'>(() => {
    return loadPersisted(getLocalDayKey())?.outcome ?? 'playing'
  })
  const [currentInput, setCurrentInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [shakeRowIndex, setShakeRowIndex] = useState<number | null>(null)
  const [animatingRowIndex, setAnimatingRowIndex] = useState<number | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flipClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => {
      setToast(null)
      toastTimer.current = null
    }, 2800)
  }, [])

  const persist = useCallback(
    (nextGuesses: string[], nextOutcome: 'playing' | 'won' | 'lost') => {
      savePersisted({
        version: 1,
        dayKey,
        guesses: nextGuesses,
        outcome: nextOutcome,
      })
    },
    [dayKey],
  )

  // If another tab updates storage, stay in sync (optional polish).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKeyForDay(dayKey) || !e.newValue) return
      try {
        const p = JSON.parse(e.newValue) as {
          guesses?: string[]
          outcome?: 'playing' | 'won' | 'lost'
        }
        if (p.guesses) setGuesses(p.guesses)
        if (p.outcome) setOutcome(p.outcome)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [dayKey])

  const feedbackRows = useMemo(
    () => guesses.map((g) => scoreGuess(secretWord, g)),
    [guesses, secretWord],
  )

  const keyboard = useMemo(
    () => foldKeyboard(guesses, feedbackRows),
    [guesses, feedbackRows],
  )

  const rows = useMemo(
    () => buildRows(guesses, currentInput, outcome, secretWord),
    [guesses, currentInput, outcome, secretWord],
  )

  const isDayComplete = outcome === 'won' || outcome === 'lost'
  const canSubmit =
    outcome === 'playing' && currentInput.length === WORD_LENGTH && !isDayComplete

  const pushLetter = useCallback(
    (letter: string) => {
      if (isDayComplete || outcome !== 'playing') return
      const L = letter.toUpperCase()
      if (!/^[A-Z]$/.test(L)) return
      if (currentInput.length >= WORD_LENGTH) return
      setCurrentInput((c) => c + L)
    },
    [currentInput.length, isDayComplete, outcome],
  )

  const deleteLetter = useCallback(() => {
    if (isDayComplete || outcome !== 'playing') return
    setCurrentInput((c) => c.slice(0, -1))
  }, [isDayComplete, outcome])

  const submitGuess = useCallback(() => {
    if (isDayComplete || outcome !== 'playing') return
    if (currentInput.length !== WORD_LENGTH) {
      showToast('Limang titik ang kailangan.')
      return
    }
    const word = normalizeWord(currentInput)
    if (word.length !== WORD_LENGTH) {
      showToast('Di wasto ang salita.')
      return
    }
    if (!isAllowedGuess(word)) {
      const rowIdx = guesses.length
      setShakeRowIndex(rowIdx)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => {
        setShakeRowIndex(null)
        shakeTimer.current = null
      }, 600)
      showToast('Hindi nasa listahan ang salitang iyan.')
      return
    }

    const nextGuesses = [...guesses, word]
    const newRow = nextGuesses.length - 1
    setAnimatingRowIndex(newRow)
    if (flipClearTimer.current) clearTimeout(flipClearTimer.current)
    flipClearTimer.current = setTimeout(() => {
      setAnimatingRowIndex(null)
      flipClearTimer.current = null
    }, 600)

    if (word === secretWord) {
      setGuesses(nextGuesses)
      setCurrentInput('')
      setOutcome('won')
      persist(nextGuesses, 'won')
      showToast('Magaling! Tama ang hula.')
      return
    }

    if (nextGuesses.length >= MAX_ATTEMPTS) {
      setGuesses(nextGuesses)
      setCurrentInput('')
      setOutcome('lost')
      persist(nextGuesses, 'lost')
      showToast(`Tapos na ang subok. Ang tamang salita: ${secretWord}`)
      return
    }

    setGuesses(nextGuesses)
    setCurrentInput('')
    persist(nextGuesses, 'playing')
  }, [
    currentInput,
    guesses,
    isDayComplete,
    outcome,
    persist,
    secretWord,
    showToast,
  ])

  // Physical keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isDayComplete) return

      if (e.key === 'Enter') {
        e.preventDefault()
        submitGuess()
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        deleteLetter()
        return
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        pushLetter(e.key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteLetter, isDayComplete, pushLetter, submitGuess])

  return {
    dayKey,
    secretWord,
    rows,
    keyboard,
    currentInput,
    outcome,
    toast,
    shakeRowIndex,
    animatingRowIndex,
    canSubmit,
    isDayComplete,
    pushLetter,
    deleteLetter,
    submitGuess,
  }
}
