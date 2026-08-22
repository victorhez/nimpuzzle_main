import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { difficultyForWord, utcDateString, wordForDate } from '@/lib/game'
import { ENTRY_LUNA, ENTRY_NIM } from '@/lib/config'
import { fail, normalizeWallet, ok } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await ensureSchema()
    const date = utcDateString()
    const word = wordForDate(date)
    const q = db()
    await q`INSERT INTO daily_puzzles (puzzle_date, word, difficulty) VALUES (${date}, ${word}, ${difficultyForWord(word)}) ON CONFLICT (puzzle_date) DO NOTHING`
    const walletParam = req.nextUrl.searchParams.get('wallet')
    const wallet = walletParam ? normalizeWallet(walletParam) : null
    const puzzle = await q`SELECT puzzle_date, difficulty, pool_luna, closed_at FROM daily_puzzles WHERE puzzle_date=${date}`
    const entry = wallet ? await q`SELECT status, tx_hash FROM entries WHERE puzzle_date=${date} AND wallet=${wallet}` : []
    const guesses = wallet ? await q`SELECT guess, result, attempt FROM guesses WHERE puzzle_date=${date} AND wallet=${wallet} ORDER BY attempt ASC` : []
    const player = wallet ? await q`SELECT current_streak, best_streak, total_won_luna, solved_count FROM players WHERE wallet=${wallet}` : []
    const count = await q`SELECT COUNT(*)::int AS count FROM entries WHERE puzzle_date=${date} AND status IN ('confirmed','paid')`
    const pool = Number(puzzle[0]?.pool_luna || 0)
    return ok({
      date,
      wordLength: word.length,
      difficulty: puzzle[0]?.difficulty,
      entryNim: ENTRY_NIM,
      entryLuna: ENTRY_LUNA,
      poolNim: pool / 100_000,
      players: Number(count[0]?.count || 0),
      closed: Boolean(puzzle[0]?.closed_at),
      entry: entry[0] || null,
      guesses,
      streak: player[0]?.current_streak || 0,
      bestStreak: player[0]?.best_streak || 0,
      totalWonNim: Number(player[0]?.total_won_luna || 0) / 100_000,
    })
  } catch (e) {
    console.error(e)
    return fail('Daily puzzle unavailable. Check your database configuration.', 500)
  }
}
