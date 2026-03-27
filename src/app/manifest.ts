import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mobel Unique — Canapes personnalisables Paris',
    short_name: 'Mobel Unique',
    description: 'Configurateur IA de canapes personnalisables.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#E49400',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
