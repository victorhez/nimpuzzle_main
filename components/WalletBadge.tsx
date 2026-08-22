'use client'
import { useState } from 'react'
import { connectNimiq } from '@/lib/nimiq'

export function WalletBadge({ onConnected }: { onConnected: (address:string)=>void }) {
  const [address,setAddress]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function connect(){
    setBusy(true); setError('')
    try { const result=await connectNimiq(); setAddress(result.address); onConnected(result.address) }
    catch(e){ setError(e instanceof Error?e.message:'Wallet connection failed') }
    finally{setBusy(false)}
  }
  return <div className="wallet-wrap">
    {address ? <div className="wallet-chip"><span className="dot"/> {address.slice(0,8)}…{address.slice(-6)}</div> : <button className="ghost-btn" onClick={connect} disabled={busy}>{busy?'Connecting…':'Connect Nimiq'}</button>}
    {error && <small className="error">{error}</small>}
  </div>
}
