import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { fail, normalizeWallet, ok } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('wallet')
    if (!raw) return fail('Wallet is required.')

    await ensureSchema()
    const q = db()
    const wallet = normalizeWallet(raw)

    const player = await q`SELECT current_streak, best_streak, total_won_luna, solved_count FROM players WHERE wallet=${wallet}`
    const totalGames = await q`SELECT COUNT(*)::int AS count FROM guesses WHERE wallet=${wallet}`
    const activity = await q`SELECT DISTINCT puzzle_date::text AS day FROM guesses WHERE wallet=${wallet} ORDER BY puzzle_date DESC LIMIT 365`

    const profile = player[0] || {
      current_streak: 0,
      best_streak: 0,
      total_won_luna: 0,
      solved_count: 0,
    }

    return ok({
      wallet,
      currentStreak: Number(profile.current_streak || 0),
      bestStreak: Number(profile.best_streak || 0),
      totalGames: Number(totalGames[0]?.count || 0),
      totalWonNim: Number(profile.total_won_luna || 0) / 100_000,
      solvedCount: Number(profile.solved_count || 0),
      activityDates: activity.map((row: any) => String(row.day)),
    })
  } catch (e) {
    console.error(e)
    return fail('Profile unavailable.', 500)
  }
}
