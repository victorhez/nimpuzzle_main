'use client'
import { useEffect, useRef, useState } from 'react'
import { connectNimiq } from '@/lib/nimiq'

export function WalletBadge({ wallet, onConnected, onProfile, onHistory, onLeaderboard }: { wallet?: string; onConnected: (address:string)=>void; onProfile: ()=>void; onHistory?: ()=>void; onLeaderboard?: ()=>void }) {
  const [address,setAddress]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [dropdownOpen,setDropdownOpen]=useState(false)
  const dropdownRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(wallet && !address) setAddress(wallet)
  },[wallet,address])

  useEffect(()=>{
    function handleClickOutside(e:MouseEvent){
      if(dropdownRef.current && !dropdownRef.current.contains(e.target as Node)){
        setDropdownOpen(false)
      }
    }
    if(dropdownOpen) document.addEventListener('mousedown',handleClickOutside)
    return ()=>document.removeEventListener('mousedown',handleClickOutside)
  },[dropdownOpen])

  async function connect(){
    setBusy(true); setError('')
    try { const result=await connectNimiq(); setAddress(result.address); onConnected(result.address) }
    catch(e){ setError(e instanceof Error?e.message:'Wallet connection failed') }
    finally{setBusy(false)}
  }

  const short = address ? `${address.slice(0,8)}…${address.slice(-6)}` : ''

  return <div className="wallet-wrap" ref={dropdownRef}>
    {address ? (
      <>
        <button className="profile-avatar" onClick={()=>setDropdownOpen(v=>!v)} aria-label="Open profile menu" title="Profile menu">NP</button>
        {dropdownOpen && (
          <div className="profile-dropdown">
            <div className="dropdown-header">
              <div className="profile-avatar large-dropdown">NP</div>
              <div className="dropdown-wallet-info">
                <div className="dropdown-wallet-label">Connected wallet</div>
                <div className="dropdown-wallet-address" title={address}>{short}</div>
              </div>
            </div>
            <div className="dropdown-divider"/>
            <button className="dropdown-item" onClick={()=>{setDropdownOpen(false);onProfile()}}>
              <span className="dropdown-icon">👤</span>
              <div className="dropdown-item-body">
                <span className="dropdown-item-title">View Profile</span>
                <span className="dropdown-item-sub">Stats, streaks & achievements</span>
              </div>
              <span className="dropdown-arrow">›</span>
            </button>
            <button className="dropdown-item" onClick={()=>{setDropdownOpen(false);onHistory?.()}}>
              <span className="dropdown-icon">📜</span>
              <div className="dropdown-item-body">
                <span className="dropdown-item-title">Game History</span>
                <span className="dropdown-item-sub">Past puzzles & solves</span>
              </div>
              <span className="dropdown-arrow">›</span>
            </button>
            <button className="dropdown-item" onClick={()=>{setDropdownOpen(false);onLeaderboard?.()}}>
              <span className="dropdown-icon">🏆</span>
              <div className="dropdown-item-body">
                <span className="dropdown-item-title">Leaderboard</span>
                <span className="dropdown-item-sub">Daily & weekly rankings</span>
              </div>
              <span className="dropdown-arrow">›</span>
            </button>
            <div className="dropdown-divider"/>
            <button className="dropdown-item danger" onClick={()=>{setAddress('');onConnected('');setDropdownOpen(false)}}>
              <span className="dropdown-icon">🔌</span>
              <div className="dropdown-item-body">
                <span className="dropdown-item-title">Disconnect wallet</span>
                <span className="dropdown-item-sub">Sign out of this device</span>
              </div>
            </button>
          </div>
        )}
      </>
    ) : (
      <button className="ghost-btn" onClick={connect} disabled={busy}>{busy?'Connecting…':'Connect Nimiq'}</button>
    )}
    {error && <small className="error">{error}</small>}
  </div>
}
