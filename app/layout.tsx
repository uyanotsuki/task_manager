import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: 'TaskForce',
  description: 'Менеджер задач для команды',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-background text-foreground`}>
        <div className="fixed inset-0 -z-10 bg-background" />
        {/* 🌫 iOS subtle depth layer */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-[-180px] left-[-180px] h-[400px] w-[400px] bg-black/5 dark:bg-white/5 blur-3xl rounded-full" />
          <div className="absolute bottom-[-180px] right-[-180px] h-[400px] w-[400px] bg-black/5 dark:bg-white/5 blur-3xl rounded-full" />
        </div>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
