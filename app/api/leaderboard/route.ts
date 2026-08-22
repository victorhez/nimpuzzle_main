import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { utcDateString } from '@/lib/game'
import { fail, ok } from '@/lib/api'
export const runtime = 'nodejs'
export async function GET(_req: NextRequest) {
  try {
    await ensureSchema(); const q=db(); const date=utcDateString()
    const daily=await q`
      SELECT g.wallet, MIN(g.attempt)::int AS guesses, p.current_streak AS streak
      FROM guesses g JOIN players p ON p.wallet=g.wallet
      WHERE g.puzzle_date=${date} AND g.guess=(SELECT word FROM daily_puzzles WHERE puzzle_date=${date})
      GROUP BY g.wallet,p.current_streak ORDER BY guesses ASC, MIN(g.created_at) ASC LIMIT 20`
    const weekly=await q`
      SELECT wallet, current_streak AS streak, best_streak AS best
      FROM players ORDER BY current_streak DESC, best_streak DESC, solved_count DESC LIMIT 20`
    return ok({daily, weekly})
  } catch (e) { console.error(e); return fail('Leaderboard unavailable.',500) }
}
