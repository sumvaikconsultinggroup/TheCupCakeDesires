import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTENT_SECURITY_POLICY } from './src/lib/csp.mjs'

const legacyRedirectMap = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'src/data/legacy-redirect-map.json'), 'utf8')
)

/** @type {import('next').NextConfig} */

const nextConfig = {
  // NOTE: `output: 'standalone'` removed — it's only needed for Docker/self-hosted
  // deploys (Vercel packages the server itself) and its symlink step fails on
  // Windows without admin rights / Developer Mode (EPERM on `next build`).
  // Re-add it only if you switch to a Docker deployment built on Linux.
  // htmlLimitedBots removed: it served Googlebot a partial HTML shell
  // without the homepage content, so crawlers missed the H1 and main copy.
  reactStrictMode: true,
  trailingSlash: false,
  // Handle trailing slashes ourselves so legacy /path/ → final dest is one hop
  // (Next's default slash strip would otherwise 308 then apply our 301).
  skipTrailingSlashRedirect: true,

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
      // '/shop' itself is handled by src/app/shop/route.ts (maps ?product_cat / ?filter_flavour).
      // Old WordPress pages still in Google's index
      ['/our-creations', '/collections/all-items'],
      ['/logo-cupcakes', '/corporate'],
      ['/cupcakes-for-corporate-events', '/corporate'],
      // Retired collections Google still requests (they rendered as soft 404s)
      ['/collections/eggless', '/eggless-cupcakes'],
      ['/collections/vegan', '/vegan-cupcakes'],
      ['/collections/standard-size-cake-slices', '/collections/cake-slices'],
      ['/bestsellers', '/collections/bestsellers'],
      ['/collections/custom-cakes', '/collections/cakes'],
      ['/collections/themed-boxes', '/collections/all-cupcakes'],
      ['/collections/cupcake-boxes', '/collections/all-cupcakes'],
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

      // GSC not-indexed: old collection/product URLs still requested
      ['/collections/mother-s-day-cupcakes', '/collections/mothers-day-cupcakes'],
      ['/collections/father-s-day-cupcakes', '/collections/fathers-day-cupcakes'],
      ['/products/gourmet-minis-box-of-12', '/collections/mini-cupcakes'],
      ['/products/pink-and-blue-mini-box-of-12', '/collections/mini-cupcakes'],
      // GSC 404s: short collection aliases still requested (leave /collections/signatures as 404)
      ['/collections/mother-s-day', '/collections/mothers-day-cupcakes'],
      ['/collections/father-s-day', '/collections/fathers-day-cupcakes'],
      ['/collections/gourmet-minis', '/collections/mini-cupcakes'],
      ['/collections/pink-and-blue-mini', '/collections/mini-cupcakes'],
      ['/manifest.json', '/manifest.webmanifest'],
      // Gift voucher variants / aliases → landing page
      // (Do not redirect /products/gift-voucher-25|50|100 — those are live product pages.)
      ['/gift-vouchers', '/gift-voucher'],
      ['/products/gift-voucher', '/gift-voucher'],
      ['/collections/gift-vouchers', '/gift-voucher'],
      ['/gift-voucher/25', '/gift-voucher'],
      ['/gift-voucher/50', '/gift-voucher'],
      ['/gift-voucher/100', '/gift-voucher'],
      ['/product-category/gift-vouchers', '/gift-voucher'],
      ['/shop/gift-voucher/gift-voucher-25', '/gift-voucher'],
      ['/shop/gift-voucher/gift-voucher-50', '/gift-voucher'],
      ['/shop/gift-voucher/gift-voucher-100', '/gift-voucher'],
      ['/products/box-of-12-chocolate-macarons', '/products/macaron-box-12'],
      ['/products/box-of-12-salted-caramel-macarons', '/products/macaron-box-12'],
      ['/products/box-of-12-strawberry-macarons', '/products/macaron-box-12'],
      ['/products/box-of-12-assorted-macarons', '/products/macaron-box-12'],
      ['/products/box-of-12-bubblegum-macarons', '/products/macaron-box-12'],
      ['/products/chocolate-minis-box-of-12', '/products/mini-cupcake-box-24-chocolate-chocolate'],
      ['/products/box-of-12-pride-day-cupcakes', '/products/pride-day-cupcakes'],

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
      ['/delivery', '/cupcake-delivery'],

      // TICKET-09: P1 redirect hygiene (evidence-backed aliases)
      ['/about', '/about-us'],
      ['/shipping', '/shipping-policy'],
      ['/flash-deals', '/deals'],
      ['/collections/flash-deals', '/deals'],
      ['/products/thank-u', '/products/box-of-12-thank-you-cupcakes'],
      ['/products/vanilla-mini-box-of-12', '/products/mini-cupcake-box-24-vanilla-base'],
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

      // Duplicate / false dietary landing → money page (single hop)
      ['/melbourne/gluten-free-cakes', '/gluten-free-cupcakes'],
      ['/melbourne/vegan-cake-delivery', '/vegan-cakes'],

      // Delivery suburb page redirects (PR #68: merged/renamed suburbs)
      ['/cupcake-delivery/clyde', '/cupcake-delivery/clyde-clyde-north'],
      ['/cupcake-delivery/clyde-north', '/cupcake-delivery/clyde-clyde-north'],
      ['/cupcake-delivery/dandenong', '/cupcake-delivery/dandenong-dandenong-north'],
      ['/cupcake-delivery/dandenong-north', '/cupcake-delivery/dandenong-dandenong-north'],
      ['/cupcake-delivery/st-kilda-road', '/cupcake-delivery/melbourne-st-kilda-rd'],
      ['/cupcake-delivery/wantirna', '/cupcake-delivery/wantirna-wantirna-south'],
      ['/cupcake-delivery/wantirna-south', '/cupcake-delivery/wantirna-wantirna-south'],
    ]

    const mappedSources = new Set(Object.keys(legacyRedirectMap.paths || {}))
    const withSlashVariants = legacyPairs
      .filter(([source]) => !mappedSources.has(source))
      .map(([source, destination]) => ({
        // One rule covers /x, /x/, /x/feed, /x/feed/ via path-to-regexp optional group.
        source: `${source}{/feed}?`,
        destination,
        permanent: true,
      }))

    /**
     * Option A: collapse bare + trailing slash + /feed + /feed/ into one redirect
     * per map key using `{/feed}?` (matches all four). Skip `/feed` suffix keys
     * (same destination as parent). Skip bare `/shop` so shop query filters stay
     * on the route handler; only `/shop/feed` is emitted here.
     */
    const mapRedirects = Object.entries(legacyRedirectMap.paths || {})
      .filter(([source]) => !source.endsWith('/feed') && source !== '/shop' && source !== '/')
      .map(([source, destination]) => ({
        source: `${source}{/feed}?`,
        destination,
        permanent: true,
      }))

    const shopRootDestination = legacyRedirectMap.paths?.['/shop'] || '/collections/all-items'
    const shopWithoutFilters = [
      {
        source: '/shop/feed{/}?',
        destination: shopRootDestination,
        permanent: true,
      },
      // Bare /shop and /shop/ only when no WooCommerce filter query is present.
      {
        source: '/shop',
        destination: shopRootDestination,
        permanent: true,
        missing: [
          { type: 'query', key: 'filter_flavour' },
          { type: 'query', key: 'product_cat' },
        ],
      },
      {
        source: '/shop/',
        destination: shopRootDestination,
        permanent: true,
        missing: [
          { type: 'query', key: 'filter_flavour' },
          { type: 'query', key: 'product_cat' },
        ],
      },
    ]

    return [
      ...mapRedirects,
      ...shopWithoutFilters,
      // Macaron: one pattern covers bare, slash, feed, feed/.
      {
        source: '/shop/macarons/box-of-12-:flavour-macarons{/feed}?',
        destination: '/products/macaron-box-12',
        permanent: true,
      },
      {
        source: '/product/box-of-12-:flavour-macarons{/feed}?',
        destination: '/products/macaron-box-12',
        permanent: true,
      },
      {
        source: '/feed{/}?',
        destination: '/',
        permanent: true,
      },
      // Unknown /.../feed → parent page (may still need a second hop if parent aliases).
      {
        source: '/:path+/feed{/}?',
        destination: '/:path+',
        permanent: true,
      },
      {
        source: '/blog{/feed}?',
        destination: '/blogs',
        permanent: true,
      },
      {
        source: '/blog/:slug{/feed}?',
        destination: '/blogs/:slug',
        permanent: true,
      },
      {
        source: '/blogs/news{/feed}?',
        destination: '/blogs',
        permanent: true,
      },
      {
        source: '/blogs/news/:slug{/feed}?',
        destination: '/blogs/:slug',
        permanent: true,
      },
      ...withSlashVariants,
      // No /:path+/ redirect: that forced /shop/?filter=… through a strip hop
      // before the shop handler. Unknown trailing slashes use a rewrite below.
    ]
  },

  async rewrites() {
    // Internal strip only (not a client hop). Lets /shop/?filter=… reach the
    // handler in one visible redirect after optional map rules miss.
    return [
      {
        source: '/:path+/',
        destination: '/:path+',
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
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ]
  },
}

export default nextConfig