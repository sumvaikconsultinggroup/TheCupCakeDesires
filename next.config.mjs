/** @type {import('next').NextConfig} */

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://cdn.shopify.com
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://*.clerk.accounts.dev
    https://*.clerk.dev
    https://clerk.gibbonnutrition.com
    https://challenges.cloudflare.com;
  connect-src 'self'
    https://*.clerk.accounts.dev
    https://*.clerk.dev
    https://clerk.gibbonnutrition.com
    https://api.clerk.dev
    https://www.google-analytics.com
    https://analytics.google.com;
  img-src 'self' data: blob:
    https://img.clerk.com
    https://images.unsplash.com
    https://unsplash.com
    https://images.pexels.com
    https://res.cloudinary.com
    https://cdn.shopify.com
    https://thecupcakedesire.com.au
    https://www.youtube.com
    https://www.googletagmanager.com
    https://www.google-analytics.com;
  frame-src 'self'
    https://challenges.cloudflare.com
    https://*.clerk.accounts.dev
    https://clerk.gibbonnutrition.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  worker-src 'self' blob:;
`
  .replace(/\s+/g, ' ')
  .trim()

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
      ['/shop', '/collections/all-items'],
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

      // Event theme pages (no dedicated /event routes)
      ['/event', '/cupcake-builder'],
      ['/event/birthday-cupcakes', '/bday-party'],
      ['/event/wedding-cupcakes', '/cupcake-builder'],
      ['/event/gender-reveal-cupcakes', '/cupcake-builder'],
      ['/event/anniversary-cupcakes', '/cupcake-builder'],
      ['/event/mothers-day-cupcakes', '/cupcake-builder'],
      ['/event/baby-boy-cupcakes', '/cupcake-builder'],
      ['/event/fathers-day-cupcakes', '/products/box-of-12-fathers-day-cupcakes'],
      ['/event/sorry-cupcakes', '/cupcake-builder'],
      ['/event/australia-day-cupcakes', '/products/box-of-12-australia-day-cupcakes'],
      ['/event/baby-girl-cupcakes', '/cupcake-builder'],
      ['/event/i-love-u-cupcakes', '/cupcake-builder'],
      ['/event/baby-neutral-cupcakes', '/cupcake-builder'],
      ['/event/easter-cupcakes', '/cupcake-builder'],
      ['/event/thank-u-cupcakes', '/products/thank-u'],
      ['/event/diwali-cupcakes', '/cupcake-builder'],
      ['/event/valentines-day-cupcakes', '/cupcake-builder'],
      ['/event/christmas-cupcakes', '/cupcake-builder'],

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
            value: cspHeader,
          },
        ],
      },
    ]
  },
}

export default nextConfig