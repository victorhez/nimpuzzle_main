'use client'
const ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']
export type KeyState='green'|'yellow'|'grey'|'idle'
export function Keyboard({states,onKey,onEnter,onBackspace,disabled}:{states:Record<string,KeyState>,onKey:(key:string)=>void,onEnter:()=>void,onBackspace:()=>void,disabled?:boolean}){
 return <div className="keyboard">{ROWS.map((row,i)=><div className="key-row" key={row}>{i===2&&<button className="key action" onClick={onBackspace} disabled={disabled}>⌫</button>}{row.split('').map(k=><button key={k} className={`key ${states[k]||'idle'}`} onClick={()=>onKey(k)} disabled={disabled}>{k}</button>)}{i===2&&<button className="key action enter" onClick={onEnter} disabled={disabled}>ENTER</button>}</div>)}</div>
}
