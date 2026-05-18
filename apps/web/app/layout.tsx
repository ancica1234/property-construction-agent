import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Providers from '@/components/providers'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Property Construction Agent',
  description: 'Manage your San Diego property construction projects',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
