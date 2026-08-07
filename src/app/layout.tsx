import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'
import Aside from '@/components/aside'
import AuthSyncProvider from '@/context/AuthSyncProvider'
import { UserAuthProvider } from '@/context/UserAuthContext'
import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Antonio, Caveat, Fraunces, Inter, JetBrains_Mono, Poppins, Roboto } from 'next/font/google'
import Script from 'next/script'
import GlobalClient from './GlobalClient'

import { ClerkProvider } from '@clerk/nextjs'

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const antonio = Antonio({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-family-antonio',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '700'],
})

const caveat = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
  weight: ['400', '500', '600'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cupcakedesires.com/'),
  title: 'The Cupcake Desire — Hand-frosted Cupcakes, Baked to Order',
  description:
    'Small-batch, hand-frosted cupcakes baked to order in Narre Warren, Melbourne. Custom cupcakes for weddings, birthdays, and corporate events — next-day delivery on a single box, 3 days’ notice for cakes. Online orders only.',
  keywords: [
    'Cupcakes',
    'Bakery',
    'Handcrafted Cupcakes',
    'Birthday Cupcakes',
    'Custom Cupcakes',
    'Cupcake Delivery',
    'Gluten Free Cupcakes',
    'Vegan Cupcakes',
    'Wedding Cupcakes',
    'The Cupcake Desire',
    'Dessert Boxes',
    'Cupcake Subscription',
  ],
  authors: [{ name: 'The Cupcake Desire' }],
  creator: 'The Cupcake Desire',
  publisher: 'The Cupcake Desire',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://cupcakedesires.com/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://cupcakedesires.com/',
    siteName: 'The Cupcake Desire',
    title: 'The Cupcake Desire — Handcrafted Cupcakes, Delivered Daily',
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
    images: [
      {
        url: 'https://cupcakedesires.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Cupcake Desire',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cupcake Desire — Handcrafted Cupcakes',
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
    images: ['https://cupcakedesires.com/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html
        lang="en"
        className={`${poppins.className} ${antonio.variable} ${roboto.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} ${fraunces.variable}`}
      >
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XDGY2JLJST"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-XDGY2JLJST');
          `}
        </Script>
        <body className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200">
          <ErrorBoundaryWrapper>
            <UserAuthProvider>
              <Aside.Provider>
                <AuthSyncProvider>{children}</AuthSyncProvider>

                {/* Client component: Toaster, ... */}
                <GlobalClient />
              </Aside.Provider>
            </UserAuthProvider>
          </ErrorBoundaryWrapper>
        </body>
      </html>
    </ClerkProvider>
  )
}
