import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

// CSP script-src : unsafe-eval uniquement en dev (requis par Turbopack HMR).
// En production, seul 'self' est autorise pour script-src.
const scriptSrc = [
  "'self'",
  ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
].join(' ')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https://*.supabase.co data: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
