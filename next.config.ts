import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimization: standalone output for optimal container deployment
  output: 'standalone',

  // Enable experimental features
  experimental: {
    // Turbopack is enabled by default in Next.js 16 for dev
    // No explicit config needed
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  // Environment variables validation
  env: {
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },

  // Disable powered-by header
  poweredByHeader: false,

  // Compression is handled by Vercel
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,
};

export default nextConfig;
