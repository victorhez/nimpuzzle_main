import { WORD_BANK } from './wordBank'

export type Tile = 'green' | 'yellow' | 'grey'

export function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

/** Deterministic UTC day selection. 459 words means the first 365 days never repeat. */
export function wordForDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  const start = new Date('2026-01-01T00:00:00.000Z')
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000)
  const index = ((day % WORD_BANK.length) + WORD_BANK.length) % WORD_BANK.length
  return WORD_BANK[index]
}

export function difficultyForWord(word: string): 'easy' | 'medium' | 'hard' {
  if (word.length <= 5) return 'easy'
  if (word.length === 6) return 'medium'
  return 'hard'
}

/** Wordle-style duplicate-aware evaluation. */
export function evaluateGuess(answer: string, guess: string): Tile[] {
  const result: Tile[] = Array(guess.length).fill('grey')
  const remaining = answer.split('')
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'green'
      remaining[i] = ''
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] !== 'grey') continue
    const idx = remaining.indexOf(guess[i])
    if (idx >= 0) {
      result[i] = 'yellow'
      remaining[idx] = ''
    }
  }
  return result
}

export function validateGuess(guess: string, answer: string) {
  return /^[a-z]+$/.test(guess) && guess.length === answer.length
}

export function tileEmoji(tiles: Tile[]) {
  return tiles.map(t => t === 'green' ? '🟩' : t === 'yellow' ? '🟨' : '⬜').join('')
}
