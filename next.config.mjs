import { CONTENT_SECURITY_POLICY } from './src/lib/csp.mjs'

/** @type {import('next').NextConfig} */

const nextConfig = {
  // NOTE: `output: 'standalone'` removed — it's only needed for Docker/self-hosted
  // deploys (Vercel packages the server itself) and its symlink step fails on
  // Windows without admin rights / Developer Mode (EPERM on `next build`).
  // Re-add it only if you switch to a Docker deployment built on Linux.
  htmlLimitedBots: /Googlebot|bingbot|Screaming Frog|AhrefsBot|SemrushBot|frog/i,
  reactStrictMode: true,
  trailingSlash: false,

  // Performance optimizations
  compress: true,

  // Development optimizations
  ...(process.env.NODE_ENV !== 'production' && {
    // Disable source maps in dev for faster builds
    productionBrowserSourceMaps: false,

    // Optimize webpack for dev
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Reduce bundle size in dev
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        }

        // Faster rebuilds
        config.watchOptions = {
          ...config.watchOptions,
          poll: false,
          aggregateTimeout: 300,
        }
      }
      return config
    },
  }),

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@headlessui/react',
      'framer-motion',
      '@heroicons/react',
      'date-fns',
      'react-hot-toast',
    ],
  },

  images: {
    minimumCacheTTL: 2678400 * 12, // ~1 year
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thecupcakedesire.com.au',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    // Old WordPress / WooCommerce paths → current storefront (301).
    // Skipped (no close page yet): /careers, /franchsing-now, /our-creation
    const legacyPairs = [
      // Home / contact
      ['/index.php', '/'],
      ['/contact-us', '/contact'],

      // Shop + category aliases
      ['/corporate/round-cake', '/corporate/logo-cakes'],
      ['/shop', '/collections/all-items'],
      // Old WordPress pages still in Google's index
      ['/our-creations', '/collections/all-items'],
      ['/logo-cupcakes', '/corporate'],
      ['/cupcakes-for-corporate-events', '/corporate'],
      ['/home', '/'],
      ['/corporate-cupcakes', '/corporate'],
      // Google Ads final URL that 404'd — keep paid clicks landing on the catalog
      // (query strings such as gclid / utm_* are preserved by Next redirects).
      ['/cupcakes', '/collections/all-items'],
      ['/cupcakes/melbourne', '/collections/all-items'],
      // Built on the cupcake builder; an in-page redirect() streamed a 200 soft redirect.
      ['/products/make-your-own-cupcake-box', '/cupcake-builder'],
      ['/shop/standard-cupcake', '/collections/standard-cupcakes'],
      ['/shop/uncategorized/standard-cupcakes', '/collections/standard-cupcakes'],
      ['/product-category/standard-cupcakes', '/collections/standard-cupcakes'],
      ['/product-category/mini-cupcakes', '/collections/mini-cupcakes'],
      ['/product-category/cakes', '/collections/cakes'],
      ['/product-category/deluxe-cupcakes', '/collections/deluxe-cupcakes'],
      ['/product-category/macarons', '/collections/macarons'],
      ['/product-category/gift-voucher', '/gift-voucher'],

      // Legacy product URLs
      ['/shop/cakes/8-chocolate-chocolate-round-cake', '/products/chocolate-chocolate-round-cake'],
      ['/shop/cakes/8-molten-chocolate-round-cake', '/products/molten-chocolate-round-cake'],
      ['/shop/cakes/8-salted-caramel-round-cake', '/products/salted-caramel-round-cake'],
      ['/shop/cakes/red-velvet-2', '/products/red-velvet-round-cake'],
      ['/shop/cakes/6-red-velvet', '/products/red-velvet-round-cake'],
      ['/shop/cakes/cookies-cream-round-cake', '/products/cookies-cream-round-cake'],
      ['/shop/cakes/custom-birthday-cake', '/products/custom-birthday-cake'],
      ['/shop/deluxe-cupcakes/gluten-free-red-velvet', '/products/gluten-free-red-velvet-3-cupcakes'],
      ['/shop/uncategorized/box-of-12-australia-day-cupcakes', '/products/box-of-12-australia-day-cupcakes'],
      ['/shop/uncategorized/box-of-12-fathers-day-cupcakes', '/products/box-of-12-fathers-day-cupcakes'],
      ['/shop/uncategorized/box-of-12-thank-you-cupcakes', '/products/box-of-12-thank-you-cupcakes'],

      // Birthday product redirects (TICKET-01: signed → /collections/birthday-cupcakes, NOT /bday-party)
      ['/birthdays', '/collections/birthday-cupcakes'],
      ['/collections/birthdays', '/collections/birthday-cupcakes'],
      // TICKET-04: /collections/all soft-404 → real catalog
      ['/collections/all', '/collections/all-items'],
      // TICKET-02 interim: /delivery 404 → /shipping-policy (footer already correct)
      ['/delivery', '/shipping-policy'],

      // TICKET-09: P1 redirect hygiene (evidence-backed aliases)
      ['/about', '/about-us'],
      ['/shipping', '/shipping-policy'],
      ['/flash-deals', '/collections/flash-deals'],
      ['/birthday', '/collections/birthday-cupcakes'],
      ['/shop/cupcakes', '/collections/all-cupcakes'],
      ['/shop/all', '/collections/all-items'],
      ['/shop/birthday', '/collections/birthday-cupcakes'],
      ['/shop/birthdays', '/collections/birthday-cupcakes'],
      // Old /event/* theme pages → their occasion collection (same search intent)
      ['/event', '/cupcake-builder'],
      ['/event/birthday-cupcakes', '/collections/birthday-cupcakes'],
      ['/event/wedding-cupcakes', '/collections/wedding-cupcakes'],
      ['/event/gender-reveal-cupcakes', '/collections/gender-reveal-cupcakes'],
      ['/event/anniversary-cupcakes', '/collections/anniversary-cupcakes'],
      ['/event/mothers-day-cupcakes', '/collections/mothers-day-cupcakes'],
      ['/event/baby-boy-cupcakes', '/collections/baby-boy-cupcakes'],
      ['/event/fathers-day-cupcakes', '/collections/fathers-day-cupcakes'],
      ['/event/sorry-cupcakes', '/collections/sorry-cupcakes'],
      ['/event/australia-day-cupcakes', '/collections/australia-day-cupcakes'],
      ['/event/baby-girl-cupcakes', '/collections/baby-girl-cupcakes'],
      ['/event/i-love-u-cupcakes', '/collections/i-love-u-cupcakes'],
      ['/event/baby-neutral-cupcakes', '/collections/baby-neutral-cupcakes'],
      ['/event/easter-cupcakes', '/collections/easter-cupcakes'],
      ['/event/thank-u-cupcakes', '/collections/thank-u-cupcakes'],
      ['/event/diwali-cupcakes', '/collections/diwali-cupcakes'],
      ['/event/valentines-day-cupcakes', '/collections/valentines-day-cupcakes'],
      ['/event/christmas-cupcakes', '/collections/christmas-cupcakes'],

      // Blog posts (old root URLs → /blogs/...)
      ['/best-cupcake-shops-in-melbourne-cbd', '/blogs/best-cupcake-shops-in-melbourne-cbd'],
      ['/where-to-buy-gluten-free-cupcakes', '/blogs/where-to-buy-gluten-free-cupcakes'],
      ['/birthday-party-ideas-melbourne', '/blogs/birthday-party-ideas-melbourne'],
      ['/nut-free-cupcakes-vs-nut-free-cakes', '/blogs/nut-free-cupcakes-vs-nut-free-cakes'],
      ['/corporate-vegan-cupcakes-for-melbourne-offices', '/blogs/corporate-vegan-cupcakes-for-melbourne-offices'],
      ['/best-vegan-cakes-in-melbourne-for-birthdays', '/blogs/best-vegan-cakes-in-melbourne-for-birthdays'],
      ['/creating-memorable-office-celebrations-with-vegan-treats', '/blogs/creating-memorable-office-celebrations-with-vegan-treats'],
      ['/how-corporate-logo-cupcakes-strengthen-brand-recognition', '/blogs/how-corporate-logo-cupcakes-strengthen-brand-recognition'],
      ['/employee-appreciation-gift-ideas-that-leave-a-lasting-impression', '/blogs/employee-appreciation-gift-ideas-that-leave-a-lasting-impression'],
      ['/corporate-gifting-ideas', '/blogs/corporate-gifting-ideas'],
      ['/how-to-celebrate-team-milestones-at-work', '/blogs/how-to-celebrate-team-milestones-at-work'],
      [
        '/cupcake-delivery-melbourne-choose-right-cupcakes',
        '/blogs/cupcake-delivery-melbourne-choose-right-cupcakes',
      ],
    ]

    const withSlashVariants = legacyPairs.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `${source}/`, destination, permanent: true },
    ])

    return [
      // Old WordPress RSS feeds (/any/page/feed) → the page itself.
      {
        source: '/feed',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:path+/feed',
        destination: '/:path+',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/blogs',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/blogs/:slug',
        permanent: true,
      },
      {
        source: '/blogs/news',
        destination: '/blogs',
        permanent: true,
      },
      {
        source: '/blogs/news/:slug',
        destination: '/blogs/:slug',
        permanent: true,
      },
      ...withSlashVariants,
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ]
  },
}

export default nextConfig