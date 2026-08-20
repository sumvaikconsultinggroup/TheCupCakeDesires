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
      {
        source: '/best-cupcake-shops-in-melbourne-cbd',
        destination: '/blogs/best-cupcake-shops-in-melbourne-cbd',
        permanent: true,
      },
      {
        source: '/best-cupcake-shops-in-melbourne-cbd/',
        destination: '/blogs/best-cupcake-shops-in-melbourne-cbd',
        permanent: true,
      },
      {
        source: '/where-to-buy-gluten-free-cupcakes',
        destination: '/blogs/where-to-buy-gluten-free-cupcakes',
        permanent: true,
      },
      {
        source: '/where-to-buy-gluten-free-cupcakes/',
        destination: '/blogs/where-to-buy-gluten-free-cupcakes',
        permanent: true,
      },
      {
        source: '/birthday-party-ideas-melbourne',
        destination: '/blogs/birthday-party-ideas-melbourne',
        permanent: true,
      },
      {
        source: '/birthday-party-ideas-melbourne/',
        destination: '/blogs/birthday-party-ideas-melbourne',
        permanent: true,
      },
      {
        source: '/nut-free-cupcakes-vs-nut-free-cakes',
        destination: '/blogs/nut-free-cupcakes-vs-nut-free-cakes',
        permanent: true,
      },
      {
        source: '/nut-free-cupcakes-vs-nut-free-cakes/',
        destination: '/blogs/nut-free-cupcakes-vs-nut-free-cakes',
        permanent: true,
      },
      {
        source: '/corporate-vegan-cupcakes-for-melbourne-offices',
        destination: '/blogs/corporate-vegan-cupcakes-for-melbourne-offices',
        permanent: true,
      },
      {
        source: '/corporate-vegan-cupcakes-for-melbourne-offices/',
        destination: '/blogs/corporate-vegan-cupcakes-for-melbourne-offices',
        permanent: true,
      },
      {
        source: '/best-vegan-cakes-in-melbourne-for-birthdays',
        destination: '/blogs/best-vegan-cakes-in-melbourne-for-birthdays',
        permanent: true,
      },
      {
        source: '/best-vegan-cakes-in-melbourne-for-birthdays/',
        destination: '/blogs/best-vegan-cakes-in-melbourne-for-birthdays',
        permanent: true,
      },
      {
        source: '/creating-memorable-office-celebrations-with-vegan-treats',
        destination: '/blogs/creating-memorable-office-celebrations-with-vegan-treats',
        permanent: true,
      },
      {
        source: '/creating-memorable-office-celebrations-with-vegan-treats/',
        destination: '/blogs/creating-memorable-office-celebrations-with-vegan-treats',
        permanent: true,
      },
      {
        source: '/how-corporate-logo-cupcakes-strengthen-brand-recognition',
        destination: '/blogs/how-corporate-logo-cupcakes-strengthen-brand-recognition',
        permanent: true,
      },
      {
        source: '/how-corporate-logo-cupcakes-strengthen-brand-recognition/',
        destination: '/blogs/how-corporate-logo-cupcakes-strengthen-brand-recognition',
        permanent: true,
      },
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