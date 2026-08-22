import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { utcDateString } from '@/lib/game'
import { PLATFORM_FEE_BPS } from '@/lib/config'
import { fail, ok } from '@/lib/api'

export const runtime='nodejs'
export const maxDuration=60

async function loadSendPayout() {
  const mod = await import('@/lib/payout')
  return mod.sendPayout
}

export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return fail('Unauthorized',401)
  try {
    await ensureSchema(); const q=db()
    const today=utcDateString(); const d=new Date(`${today}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate()-1); const date=d.toISOString().slice(0,10)
    const puzzle=await q`SELECT pool_luna, closed_at FROM daily_puzzles WHERE puzzle_date=${date}`
    if(!puzzle.length) return ok({message:'No puzzle to settle',date})
    if(puzzle[0].closed_at) return ok({message:'Already settled',date})
    const solvers=await q`SELECT DISTINCT g.wallet FROM guesses g WHERE g.puzzle_date=${date} AND g.guess=(SELECT word FROM daily_puzzles WHERE puzzle_date=${date})`
    const pool=BigInt(puzzle[0].pool_luna || 0)
    const fee=(pool*BigInt(PLATFORM_FEE_BPS))/10_000n
    const distributable=pool-fee
    const share=solvers.length ? distributable/BigInt(solvers.length) : 0n
    await q.begin(async sql=>{
      await sql`UPDATE daily_puzzles SET closed_at=NOW() WHERE puzzle_date=${date} AND closed_at IS NULL`
      for(const solver of solvers){
        await sql`INSERT INTO payouts (puzzle_date,wallet,amount_luna,status) VALUES (${date},${solver.wallet},${share.toString()},'queued') ON CONFLICT DO NOTHING`
        await sql`
  UPDATE players
  SET total_won_luna=total_won_luna+${share.toString()},
      updated_at=NOW()
  WHERE wallet=${solver.wallet}
`
      }
    })
    let sent=0, queued=0, failed=0
    if(process.env.NIMIQ_PAYOUT_PRIVATE_KEY && share > 0n){
      const sendPayout = await loadSendPayout()
      const pending=await q`SELECT wallet, amount_luna FROM payouts WHERE puzzle_date=${date} AND status='queued'`
      for(const row of pending){
        try{
          const txHash=await sendPayout(row.wallet,BigInt(row.amount_luna))
          await q`UPDATE payouts SET status='sent', tx_hash=${txHash} WHERE puzzle_date=${date} AND wallet=${row.wallet}`
          await q`UPDATE entries SET status='paid' WHERE puzzle_date=${date} AND wallet=${row.wallet}`
          sent++
        }catch(error){ console.error('payout failed',row.wallet,error); await q`UPDATE payouts SET status='failed' WHERE puzzle_date=${date} AND wallet=${row.wallet}`; failed++ }
      }
    } else queued=solvers.length
    return ok({date,poolLuna:pool.toString(),feeLuna:fee.toString(),distributableLuna:distributable.toString(),solverCount:solvers.length,shareLuna:share.toString(),payoutStatus:{sent,queued,failed}})
  } catch(e){console.error(e);return fail('Settlement failed.',500)}
}
