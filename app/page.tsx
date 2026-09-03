'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Keyboard, KeyState } from '@/components/Keyboard'
import { PuzzleGrid } from '@/components/PuzzleGrid'
import { WalletBadge } from '@/components/WalletBadge'
import { payStake } from '@/lib/nimiq'

type Daily={date:string;wordLength:number;difficulty:string;entryNim:number;poolNim:number;players:number;closed:boolean;entry:{status:string}|null;guesses:{guess:string;result:string;attempt:number}[];streak:number;bestStreak:number;totalWonNim:number}
type View='home'|'game'|'leaderboard'|'history'|'profile'
const DEMO_WALLET='NQ-DEMO-NIMPUZZLE-PLAYER-2026'

export default function Home(){
 const [wallet,setWallet]=useState('')
 const [daily,setDaily]=useState<Daily|null>(null)
 const [view,setView]=useState<View>('home')
 const [loading,setLoading]=useState(true)
 const [entryBusy,setEntryBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [gameOver,setGameOver]=useState(false)
 const [lastResult,setLastResult]=useState<{solved:boolean;answer?:string;attempt:number;pattern:string;streak:number;share:number}|null>(null)
 const [current,setCurrent]=useState('')
 const [keyStates,setKeyStates]=useState<Record<string,KeyState>>({})
 const [leader,setLeader]=useState<any>({daily:[],weekly:[]})
 const [history,setHistory]=useState<any[]>([])
 const [profile,setProfile]=useState<any>(null)

 const load=useCallback(async(addr?:string)=>{
   setLoading(true)
   try{const r=await fetch(`/api/daily${addr?`?wallet=${encodeURIComponent(addr)}`:''}`,{cache:'no-store'});const j=await r.json();if(j.ok)setDaily(j)}catch{}finally{setLoading(false)}
 },[])
 const loadProfile=useCallback(async(addr?:string)=>{
   const active=addr || wallet
   if(!active) return
   try{const r=await fetch(`/api/profile?wallet=${encodeURIComponent(active)}`,{cache:'no-store'});const j=await r.json();if(j.ok)setProfile(j)}catch{}
 },[wallet])
 useEffect(()=>{load()},[load])
 useEffect(()=>{if(wallet) load(wallet)},[wallet,load])
 useEffect(()=>{if(wallet) loadProfile(wallet)},[wallet,loadProfile])

 const startEntry=async()=>{
   setEntryBusy(true);setMessage('')
   try{
     let addr=wallet
     let txHash:string|undefined
     if(!addr){addr=DEMO_WALLET;setWallet(addr)}
     // In production, the browser performs the native Nimiq Pay confirmation.
     // The API then verifies the returned hash on-chain.
     if(process.env.NEXT_PUBLIC_LIVE_PAYMENTS==='true'){
       if(!addr || addr===DEMO_WALLET) throw new Error('Connect your Nimiq wallet first.')
       const paid=await payStake(process.env.NEXT_PUBLIC_NIMIQ_TREASURY_ADDRESS||'',Math.round((daily?.entryNim||1250)*100000))
       txHash=paid.txHash
     }
     const r=await fetch('/api/enter',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({wallet:addr,txHash})})
     const j=await r.json();if(!j.ok)throw new Error(j.error)
     setMessage(j.demo?'Demo entry active — no real NIM was moved.':'Entry confirmed on Nimiq.')
     await load(addr);setView('game')
   }catch(e){setMessage(e instanceof Error?e.message:'Could not enter')}finally{setEntryBusy(false)}
 }

 const submitGuess=async()=>{
   if(!daily||current.length!==daily.wordLength||gameOver)return
   const r=await fetch('/api/guess',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({wallet:wallet||DEMO_WALLET,guess:current.toLowerCase()})})
   const j=await r.json();if(!j.ok){setMessage(j.error);return}
   const result=j.tiles as KeyState[]
   setKeyStates(prev=>{const next={...prev};current.split('').forEach((ch,i)=>{const k=ch.toUpperCase();const tile=result[i] as KeyState;const rank:Record<KeyState,number>={idle:0,grey:1,yellow:2,green:3};if(!next[k]||rank[tile] > rank[next[k]])next[k]=tile});return next})
   setCurrent('')
   setLastResult({solved:j.solved,answer:j.answer,attempt:j.attempt,pattern:j.pattern,streak:j.streak,share:j.estimatedShareNim})
   if(j.solved||j.failed){setGameOver(true);setView('home');await load(wallet||DEMO_WALLET)}
 }
 const handleKey=(k:string)=>{if(!daily||gameOver)return;setMessage('');if(current.length<daily.wordLength)setCurrent(v=>v+k.toLowerCase())}
 const back=()=>setCurrent(v=>v.slice(0,-1))
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(view!=='game')return;if(e.key==='Enter')submitGuess();else if(e.key==='Backspace')back();else if(/^[a-zA-Z]$/.test(e.key))handleKey(e.key.toUpperCase())};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)})

 const openBoard=async()=>{const r=await fetch('/api/leaderboard');const j=await r.json();if(j.ok)setLeader(j);setView('leaderboard')}
 const openHistory=async()=>{const addr=wallet||DEMO_WALLET;const r=await fetch(`/api/history?wallet=${encodeURIComponent(addr)}`);const j=await r.json();if(j.ok)setHistory(j.history);setView('history')}
 const openProfile=async()=>{
   const addr=wallet
   if(!addr){setMessage('Connect your Nimiq wallet to open your profile.'); return}
   const r=await fetch(`/api/profile?wallet=${encodeURIComponent(addr)}`)
   const j=await r.json()
   if(j.ok)setProfile(j)
   setView('profile')
 }
 const share=()=>{if(!lastResult)return;const text=`NimPuzzle ${lastResult.solved?'🏆':'🧩'} ${lastResult.attempt}/6\n${lastResult.pattern}\n${lastResult.solved?`Streak: ${lastResult.streak} 🔥`: 'Back tomorrow.'}\n\n#NimPuzzle #Nimiq #Web3` ;window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer')}
 const attemptsUsed=daily?.guesses.length||0
 const canPlay=Boolean(daily?.entry && ['confirmed','paid'].includes(daily.entry.status))
 const progress=useMemo(()=>daily?`${attemptsUsed}/6`: '—',[daily,attemptsUsed])

 return <main className="shell">
   <header className="topbar"><div className="brand" onClick={()=>setView('home')}><Image src="/logo.png" alt="NimPuzzle logo" width={42} height={42} className="brand-logo" priority /><div><b>NimPuzzle</b><span>DAILY NIM CHALLENGE</span></div></div><WalletBadge onConnected={setWallet}/></header>
   <div className="content">
     <nav className="nav"><button className={view==='home'?'active':''} onClick={()=>setView('home')}>Today</button><button className={view==='leaderboard'?'active':''} onClick={openBoard}>Leaderboard</button><button className={view==='history'?'active':''} onClick={openHistory}>History</button><button className={view==='profile'?'active':''} onClick={openProfile}>Profile</button></nav>
     {loading?<div className="loader">Loading today’s puzzle…</div>:view==='leaderboard'?<Leaderboard data={leader}/>:view==='history'?<History rows={history}/>:view==='profile'?<ProfileScreen profile={profile} wallet={wallet||DEMO_WALLET}/>:view==='game'&&daily?<Game daily={daily} current={current} keyStates={keyStates} attempts={progress} onKey={handleKey} onEnter={submitGuess} onBackspace={back} disabled={gameOver}/>:<>
       <section className="hero">
         <div className="eyebrow"><span className="live-dot"/> DAILY CHALLENGE · {daily?.date}</div>
         <h1>Guess the word.<br/><em>Win the pool.</em></h1>
         <p className="lede">One crypto word. Six attempts. Everyone plays the same puzzle.</p>
         <div className="stats"><Stat label="PRIZE POOL" value={`${daily?.poolNim.toFixed(2)} NIM`} accent/><Stat label="PLAYERS" value={`${daily?.players||0}`}/><Stat label="STREAK" value={`${daily?.streak||0} 🔥`}/></div>
       </section>
       {message&&<div className="notice">{message}</div>}
       {lastResult&&<Result result={lastResult} onShare={share} onPlay={startEntry}/>} 
       {!lastResult&&<section className="entry-card"><div className="entry-copy"><span className="mini-label">TODAY’S STAKE</span><strong>{daily?.entryNim} NIM</strong><p>Join the pool. Solve today’s word. Winners split 95% of the pool equally at day close.</p></div><button className="primary" onClick={canPlay?()=>setView('game'):startEntry} disabled={entryBusy||daily?.closed}>{daily?.closed?'CLOSED':entryBusy?'CONFIRMING…':canPlay?'CONTINUE PUZZLE':'PLAY FOR NIM'}</button><small>Word length: {daily?.wordLength} letters · 6 attempts</small></section>}
       <section className="guide-card">
         <div className="page-title"><span className="mini-label">HOW TO PLAY</span><h1>Rules of the daily puzzle</h1></div>
         <div className="guide-grid">
           <GuideStep n="01" title="Connect wallet" text="Use your Nimiq wallet to enter the daily challenge with the required 1250 NIM stake."/>
           <GuideStep n="02" title="Make a guess" text="Type a valid word matching the day’s length. Colour feedback shows what is correct, misplaced, or missing."/>
           <GuideStep n="03" title="Win the pool" text="Solve the word before six attempts end. Winners split the prize pool at day close."/>
           <GuideStep n="04" title="Build streaks" text="Play daily to push your current streak higher and keep your wallet profile active across the calendar."/>
         </div>
       </section>
       {profile&&<StreakCalendar dates={profile.activityDates || []} currentStreak={profile.currentStreak || 0} bestStreak={profile.bestStreak || 0} wallet={wallet || DEMO_WALLET}/>} 
       <footer><span>NIMPUZZLE · BUILT FOR NIMIQ PAY</span><span>NO AUDIO · MOBILE FIRST · ONE WORD / DAY</span></footer>
     </>}
   </div>
 </main>
}

function Stat({label,value,accent}:{label:string,value:string,accent?:boolean}){return <div className="stat"><span>{label}</span><strong className={accent?'accent':''}>{value}</strong></div>}
function Feature({n,title,text}:{n:string;title:string;text:string}){return <div className="feature"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>}
function GuideStep({n,title,text}:{n:string;title:string;text:string}){return <div className="guide-item"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>}
function Result({result,onShare,onPlay}:{result:any;onShare:()=>void;onPlay:()=>void}){return <section className={`result-card ${result.solved?'win':''}`}><div><span className="mini-label">{result.solved?'PUZZLE SOLVED':'PUZZLE COMPLETE'}</span><h2>{result.solved?'You cracked it.':'Better luck tomorrow.'}</h2><p>{result.solved?`Solved in ${result.attempt}/6 · estimated share ${result.share} NIM`:`The answer was ${result.answer?.toUpperCase()}.`}</p>{result.solved&&<div className="streak-big">{result.streak} day streak 🔥</div>}</div><div className="share-preview">{result.pattern}<button className="ghost-btn" onClick={onShare}>Share result ↗</button></div><button className="primary" onClick={onPlay}>Tomorrow’s challenge</button></section>}
function Game({daily,current,keyStates,attempts,onKey,onEnter,onBackspace,disabled}:{daily:Daily;current:string;keyStates:Record<string,KeyState>;attempts:string;onKey:(k:string)=>void;onEnter:()=>void;onBackspace:()=>void;disabled:boolean}){return <section className="game"><div className="game-head"><div><span className="mini-label">DAILY PUZZLE</span><h2>{daily.wordLength} letters · {attempts} attempts</h2></div><div className="pool-pill">{daily.poolNim.toFixed(2)} NIM pool</div></div><PuzzleGrid length={daily.wordLength} guesses={daily.guesses.map(g=>({...g,result:JSON.parse(g.result)}))} current={current}/><Keyboard states={keyStates} onKey={onKey} onEnter={onEnter} onBackspace={onBackspace} disabled={disabled}/><p className="hint">ENTER to submit · BACKSPACE to erase</p></section>}
function Leaderboard({data}:{data:any}){return <section className="board"><div className="page-title"><span className="mini-label">THE DAILY RACE</span><h1>Leaderboard</h1><p>Fastest solves rise to the top. Long streaks dominate the weekly board.</p></div><div className="board-grid"><BoardTable title="TODAY" rows={data.daily} keyName="guesses" suffix=" guesses"/><BoardTable title="WEEKLY STREAK" rows={data.weekly} keyName="streak" suffix=" days 🔥"/></div></section>}
function BoardTable({title,rows,keyName,suffix}:{title:string;rows:any[];keyName:string;suffix:string}){return <div className="table-card"><div className="table-title">{title}</div>{rows.length?rows.map((r,i)=><div className="rank-row" key={r.wallet}><b>#{i+1}</b><span>{r.wallet.slice(0,7)}…{r.wallet.slice(-4)}</span><strong>{r[keyName]}{suffix}</strong></div>):<div className="empty">No scores yet. Be first.</div>}</div>}
function History({rows}:{rows:any[]}){return <section className="board"><div className="page-title"><span className="mini-label">YOUR RECORD</span><h1>History</h1><p>Every attempt, every solve, every streak.</p></div><div className="table-card wide">{rows.length?rows.map((r,i)=><div className="history-row" key={`${r.puzzle_date}-${r.attempt}-${i}`}><span>{new Date(r.puzzle_date).toLocaleDateString()}</span><b>{r.guess.toUpperCase()}</b><span>{r.attempt}/6</span><span>{r.result.includes('green')?'Solved':'Played'}</span></div>):<div className="empty">No games recorded yet.</div>}</div></section>}
function ProfileScreen({profile,wallet}:{profile:any;wallet:string}){if(!profile){return <section className="board"><div className="page-title"><span className="mini-label">YOUR PROFILE</span><h1>Wallet profile</h1><p>Connect your wallet so your daily streak and activity calendar can appear here.</p></div></section>}
  return <section className="board"><div className="page-title"><span className="mini-label">YOUR PROFILE</span><h1>Wallet profile</h1><p>{wallet.slice(0,8)}…{wallet.slice(-6)} · {profile.currentStreak || 0} day streak</p></div><div className="profile-grid"><div className="profile-card"><div className="profile-header"><span className="dot"/> {wallet.slice(0,8)}…{wallet.slice(-6)}</div><div className="profile-stats"><div><label>Current streak</label><strong>{profile.currentStreak || 0} days</strong></div><div><label>Best streak</label><strong>{profile.bestStreak || 0} days</strong></div><div><label>Total games</label><strong>{profile.totalGames || 0}</strong></div><div><label>Rewards</label><strong>{Number(profile.totalWonNim || 0).toFixed(2)} NIM</strong></div></div></div><StreakCalendar dates={profile.activityDates || []} currentStreak={profile.currentStreak || 0} bestStreak={profile.bestStreak || 0} wallet={wallet}/></div></section>}
function StreakCalendar({dates,currentStreak,bestStreak,wallet}:{dates:string[];currentStreak:number;bestStreak:number;wallet:string}){const today=new Date(); const start=new Date(today); start.setUTCDate(today.getUTCDate()-34); const cells: {date:string;active:boolean;today:boolean}[]=[]; for(let i=0;i<35;i++){const d=new Date(start); d.setUTCDate(start.getUTCDate()+i); const key=d.toISOString().slice(0,10); cells.push({date:key,active:dates.includes(key),today:key===today.toISOString().slice(0,10)}) } return <div className="calendar-card"><div className="calendar-top"><div><span className="mini-label">ACTIVITY</span><h2>Daily streak calendar</h2></div><div className="badge-row"><span className="pill">current {currentStreak}d</span><span className="pill">best {bestStreak}d</span></div></div><div className="calendar-grid">{cells.map(cell=><div key={cell.date} className={`calendar-day ${cell.active?'active':''} ${cell.today?'today':''}`} title={`${cell.date}${cell.active?' — played':''}`}><span>{new Date(cell.date).toLocaleDateString('en-US',{day:'numeric'})}</span></div>)}</div><p className="calendar-note">{wallet.slice(0,8)}…{wallet.slice(-6)} has played on {dates.length} day{dates.length===1?'':'s'} in the recent activity window.</p></div>}
