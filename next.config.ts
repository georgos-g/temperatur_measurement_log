import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'temp-log.eu-central-1.linodeobjects.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.linodeobjects.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
