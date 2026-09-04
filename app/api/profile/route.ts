import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { fail, normalizeWallet, ok } from '@/lib/api'
import { rpc } from '@/lib/rpc'

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
    let balanceNim: number | null = null
    try {
      const account = await rpc('getAccountByAddress', [wallet])
      if (account?.balance !== undefined) balanceNim = Number(account.balance) / 100_000
    } catch {}

    const profile = player[0] || {
      current_streak: 0,
      best_streak: 0,
      total_won_luna: 0,
      solved_count: 0,
    }

    const totalGamesCount = Number(totalGames[0]?.count || 0)
    const solvedCount = Number(profile.solved_count || 0)
    const currentStreak = Number(profile.current_streak || 0)
    const xp = totalGamesCount * 10 + solvedCount * 100 + currentStreak * 25
    const achievements = [
      totalGamesCount >= 1 ? 'First guess' : null,
      solvedCount >= 1 ? 'First solve' : null,
      currentStreak >= 3 ? 'Three-day streak' : null,
      solvedCount >= 10 ? 'Puzzle regular' : null,
    ].filter(Boolean)
    return ok({
      wallet,
      currentStreak,
      bestStreak: Number(profile.best_streak || 0),
      totalGames: totalGamesCount,
      totalWonNim: Number(profile.total_won_luna || 0) / 100_000,
      solvedCount,
      balanceNim,
      xp,
      achievements,
      activityDates: activity.map((row: any) => String(row.day)),
    })
  } catch (e) {
    console.error(e)
    return fail('Profile unavailable.', 500)
  }
}
