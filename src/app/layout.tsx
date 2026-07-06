import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Schulbestellung archiviert — OSS Steffisburg',
  description: 'Die Ingold/Biwa Sammelbestellung 2026 ist abgeschlossen und archiviert.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
