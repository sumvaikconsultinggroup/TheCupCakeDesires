import type { MetadataRoute } from 'next'

/** Served at /manifest.webmanifest (layout metadata.manifest). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Cupcake Desire',
    short_name: 'Cupcake Desire',
    description:
      'Hand-frosted cupcakes baked to order in Narre Warren. Melbourne Metro delivery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF7F2',
    theme_color: '#2e1f15',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
