import type { Metadata, Viewport } from 'next'
import './globals.css'
export const metadata: Metadata={title:'NimPuzzle — The daily NIM word game',description:'Solve the daily crypto word. Stake NIM. Share the win.'}
export const viewport: Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f5c400'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
