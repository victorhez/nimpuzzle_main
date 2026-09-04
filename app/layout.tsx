import type { Metadata, Viewport } from 'next'
import './globals.css'

const logoPath = '/logo.png'

export const metadata: Metadata={
  title:'NimPuzzle — The daily NIM word game',
  description:'Solve the daily crypto word. Stake NIM. Share the win.',
  icons:{icon:logoPath,apple:logoPath},
  openGraph:{
    title:'NimPuzzle — The daily NIM word game',
    description:'Solve the daily crypto word. Stake NIM. Share the win.',
    images:[{url:logoPath,alt:'NimPuzzle logo'}],
  },
  twitter:{
    card:'summary',
    title:'NimPuzzle — The daily NIM word game',
    description:'Solve the daily crypto word. Stake NIM. Share the win.',
    images:[logoPath],
  },
}
export const viewport: Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f5c400'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
