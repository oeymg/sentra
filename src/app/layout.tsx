import type { Metadata } from 'next'
import './globals.css'
import ScrollProgress from '@/components/ScrollProgress'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ScrollProgress />
        {children}
      </body>
    </html>
  )
}
