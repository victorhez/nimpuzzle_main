'use client'
import { Tile } from '@/lib/game'
export function PuzzleGrid({length,guesses,current}:{length:number,guesses:{guess:string,result:Tile[]}[],current:string}){
 const rows=Array.from({length:6},(_,i)=>guesses[i])
 return <div className="grid">{rows.map((g,r)=><div className="grid-row" key={r}>{Array.from({length},(_,c)=>{
   const letter=g?.guess?.[c] || (r===guesses.length ? current[c] : '')
   const state=(g?.result?.[c] || '') as string
   return <div key={c} className={`tile ${state}`}>{letter?.toUpperCase()}</div>
 })}</div>)}</div>
}
