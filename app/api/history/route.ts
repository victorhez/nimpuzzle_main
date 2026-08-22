import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { fail, normalizeWallet, ok } from '@/lib/api'
export const runtime='nodejs'
export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get('wallet'); if(!raw) return fail('Wallet is required.')
  try { await ensureSchema(); const q=db(); const wallet=normalizeWallet(raw)
    const rows=await q`SELECT g.puzzle_date, g.attempt, g.guess, g.result, p.total_won_luna FROM guesses g JOIN players p ON p.wallet=g.wallet WHERE g.wallet=${wallet} ORDER BY g.puzzle_date DESC, g.attempt ASC LIMIT 200`
    return ok({history:rows})
  } catch(e){console.error(e);return fail('History unavailable.',500)}
}
