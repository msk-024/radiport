import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { AnonAuthProvider } from '@/features/auth/components/AnonAuthProvider'
import { PwaInstallGuide } from '@/features/pwa/components/PwaInstallGuide'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Radiport',
    template: '%s | Radiport',
  },
  description: '香川県のラジオ局をまとめて聴けるポータルアプリ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Radiport',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-[#0f0f0f] text-white antialiased">
        <AnonAuthProvider>
          {children}
          <PwaInstallGuide />
        </AnonAuthProvider>
      </body>
    </html>
  )
}
