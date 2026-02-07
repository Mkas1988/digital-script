import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only packages that shouldn't be bundled for client
  serverExternalPackages: ['sharp', 'pdfjs-dist'],

  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},

  // Image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
