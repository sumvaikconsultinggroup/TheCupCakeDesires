import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'
import Aside from '@/components/aside'
import AuthSyncProvider from '@/context/AuthSyncProvider'
import { UserAuthProvider } from '@/context/UserAuthContext'
import '@/styles/tailwind.css'
import { getMetadataBase, absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { GOOGLE_ADS_ID } from '@/lib/purchase-tracking'
import GlobalClient from './GlobalClient'

import { ClerkProvider } from '@clerk/nextjs'

// Self-hosted latin files so `next build` never fetches Google Fonts.
// next/font/google on 16.1.0 crashes when Google returns extensionless
// /l/font?kit= URLs (TypeError: Cannot read properties of null (reading '1')).
const poppins = localFont({
  src: [
    { path: './fonts/poppins-300.woff2', weight: '300', style: 'normal' },
    { path: './fonts/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
  preload: false,
})

const antonio = localFont({
  src: [{ path: './fonts/antonio-700.woff2', weight: '700', style: 'normal' }],
  display: 'swap',
  variable: '--font-family-antonio',
  adjustFontFallback: false,
  fallback: ['Arial Narrow', 'Arial', 'sans-serif'],
  preload: false,
})

const roboto = localFont({
  src: './fonts/roboto-400-700.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-roboto',
  adjustFontFallback: false,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
  preload: false,
})

const inter = localFont({
  src: './fonts/inter-100-900.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-inter',
  adjustFontFallback: false,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
})

const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono-400-700.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-jetbrains-mono',
  adjustFontFallback: false,
  fallback: ['Courier New', 'Courier', 'monospace'],
  preload: false,
})

const caveat = localFont({
  src: './fonts/caveat-400-700.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-caveat',
  adjustFontFallback: false,
  fallback: ['Comic Sans MS', 'cursive'],
  preload: false,
})

const fraunces = localFont({
  src: './fonts/fraunces-100-900.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-fraunces',
  adjustFontFallback: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'The Cupcake Desire | Hand-frosted Cupcakes, Baked to Order',
  description:
    'Hand-frosted cupcakes baked to order in Narre Warren for weddings, birthdays and corporate events. Melbourne Metro weekday delivery. Online only.',
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
    'Cupcake Delivery Melbourne',
    'Corporate Cupcakes',
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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: absoluteUrl('/'),
    siteName: 'The Cupcake Desire',
    title: 'The Cupcake Desire | Cupcakes Melbourne, Baked to Order',
    description:
      'Hand-frosted cupcakes baked to order in Narre Warren. Next-weekday delivery across Melbourne Metro.',
    images: [
      {
        url: absoluteUrl('/og-image.png'),
        width: 1200,
        height: 630,
        alt: 'The Cupcake Desire',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cupcake Desire | Cupcakes Melbourne, Baked to Order',
    description:
      'Hand-frosted cupcakes baked to order in Narre Warren. Next-weekday delivery across Melbourne Metro.',
    images: [absoluteUrl('/og-image.png')],
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
        lang="en-AU"
        className={`${poppins.className} ${antonio.variable} ${roboto.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} ${fraunces.variable}`}
      >
        {/* Google Tag Manager */}
        {/* GTM loads after the page is interactive; conversions/GA4 use the gtag below. */}
        <Script id="google-tag-manager" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NFS6S4XF');`}
        </Script>
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

            gtag('config', 'G-XDGY2JLJST');${GOOGLE_ADS_ID ? `
            gtag('config', '${GOOGLE_ADS_ID}');` : ''}
          `}
        </Script>
        <body className="text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200">
          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-NFS6S4XF"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
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
