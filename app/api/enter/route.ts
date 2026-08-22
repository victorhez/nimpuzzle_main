import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, ensureSchema } from '@/lib/db'
import { difficultyForWord, utcDateString, wordForDate } from '@/lib/game'
import { ENTRY_LUNA, LIVE_PAYMENTS } from '@/lib/config'
import { fail, normalizeWallet, ok } from '@/lib/api'
import { verifyPayment } from '@/lib/rpc'

export const runtime = 'nodejs'
const bodySchema = z.object({ wallet: z.string().min(10), txHash: z.string().optional() })

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json())
    const wallet = normalizeWallet(body.wallet)
    const date = utcDateString()
    await ensureSchema()
    const q = db()
    await q`INSERT INTO daily_puzzles (puzzle_date, word, difficulty) VALUES (${date}, ${wordForDate(date)}, ${difficultyForWord(wordForDate(date))}) ON CONFLICT (puzzle_date) DO NOTHING`
    const existing = await q`SELECT status FROM entries WHERE puzzle_date=${date} AND wallet=${wallet}`
    if (existing.length) return fail('You have already entered today.', 409)

    let status: 'pending' | 'confirmed' = 'pending'
    if (!LIVE_PAYMENTS) {
      status = 'confirmed'
    } else {
      if (!body.txHash) return fail('Payment transaction hash is required.')
      const verification = await verifyPayment(body.txHash, wallet, ENTRY_LUNA)
      if (!verification.valid) return fail(verification.reason)
      status = 'confirmed'
    }

    await q.begin(async sql => {
      await sql`INSERT INTO players (wallet) VALUES (${wallet}) ON CONFLICT (wallet) DO NOTHING`
      await sql`INSERT INTO entries (puzzle_date, wallet, stake_luna, tx_hash, status) VALUES (${date}, ${wallet}, ${ENTRY_LUNA}, ${body.txHash || null}, ${status})`
      if (status === 'confirmed') await sql`UPDATE daily_puzzles SET pool_luna = pool_luna + ${ENTRY_LUNA} WHERE puzzle_date=${date}`
    })
    return ok({ status, demo: !LIVE_PAYMENTS, message: status === 'confirmed' ? 'Entry confirmed. Good luck!' : 'Payment pending verification.' })
  } catch (e) {
    console.error(e)
    return fail('Could not create entry.', 500)
  }
}
