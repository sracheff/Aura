import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LUMA — Salon Management Platform',
  description: 'The all-in-one operating system for beauty businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
