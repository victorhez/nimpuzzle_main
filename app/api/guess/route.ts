import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, ensureSchema } from '@/lib/db'
import { evaluateGuess, tileEmoji, utcDateString, validateGuess, wordForDate } from '@/lib/game'
import { fail, normalizeWallet, ok } from '@/lib/api'

export const runtime = 'nodejs'
const schema = z.object({ wallet: z.string().min(10), guess: z.string().min(4).max(7) })

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const wallet = normalizeWallet(body.wallet)
    const guess = body.guess.toLowerCase()
    const date = utcDateString()
    const answer = wordForDate(date)
    if (!validateGuess(guess, answer)) return fail(`Guess must be exactly ${answer.length} letters.`)
    await ensureSchema()
    const q = db()
    const entry = await q`SELECT status FROM entries WHERE puzzle_date=${date} AND wallet=${wallet}`
    if (!entry.length || !['confirmed','paid'].includes(entry[0].status)) return fail('Stake to enter today\'s puzzle first.', 403)
    const attempts = await q`SELECT attempt FROM guesses WHERE puzzle_date=${date} AND wallet=${wallet} ORDER BY attempt ASC`
    if (attempts.length >= 6) return fail('You have used all 6 attempts.', 409)
    const attempt = attempts.length + 1
    const tiles = evaluateGuess(answer, guess)
    const solved = guess === answer
    await q`INSERT INTO guesses (puzzle_date, wallet, guess, result, attempt) VALUES (${date}, ${wallet}, ${guess}, ${JSON.stringify(tiles)}, ${attempt})`

    let streak = 0
    if (solved) {
      const yesterday = new Date(`${date}T00:00:00.000Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const y = yesterday.toISOString().slice(0,10)
      const solvedYesterday = await q`SELECT 1 FROM guesses WHERE puzzle_date=${y} AND wallet=${wallet} AND guess=(SELECT word FROM daily_puzzles WHERE puzzle_date=${y}) LIMIT 1`
      const previous = await q`SELECT current_streak, best_streak FROM players WHERE wallet=${wallet}`
      streak = solvedYesterday.length ? Number(previous[0]?.current_streak || 0) + 1 : 1
      const best = Math.max(streak, Number(previous[0]?.best_streak || 0))
      await q`UPDATE players SET current_streak=${streak}, best_streak=${best}, solved_count=solved_count+1, updated_at=NOW() WHERE wallet=${wallet}`
    }

    const pool = await q`SELECT pool_luna FROM daily_puzzles WHERE puzzle_date=${date}`
    const poolNim = Number(pool[0]?.pool_luna || 0) / 100_000
    return ok({
      attempt,
      tiles,
      pattern: tileEmoji(tiles),
      solved,
      failed: !solved && attempt >= 6,
      answer: solved || attempt >= 6 ? answer : undefined,
      streak,
      estimatedShareNim: solved ? Number((poolNim * 0.95).toFixed(5)) : 0,
    })
  } catch (e) {
    console.error(e)
    return fail('Could not submit guess.', 500)
  }
}
