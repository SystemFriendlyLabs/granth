import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Granth — SFL Knowledge Base',
  description: 'SFL internal knowledge assistant',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="theme-color" content="#1a1a1a"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="Granth"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
