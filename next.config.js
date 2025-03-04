/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  images: {
    domains: ['localhost'],
  },
  // Optimize for file locking issues
  onDemandEntries: {
    // Keep pages in memory for longer (default is 15 seconds)
    maxInactiveAge: 60 * 1000,
    // Number of pages to keep in memory (default is 5)
    pagesBufferLength: 2,
  },
  // Disable source maps in development to reduce file operations
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval';
    }
    return config;
  },
  // Reduce the frequency of type checking to prevent file locks
  typescript: {
    // Disable type checking during development to reduce file operations
    // You should run type checking manually with `npm run type-check` instead
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // Disable file system watching for specific directories
  experimental: {
    // Valid experimental options for Next.js 13.5.8
    workerThreads: false,
    // Reduce file system operations
    swcMinify: true,
    // Disable font optimization (using a valid property)
    optimizeCss: false,
  },
}

module.exports = nextConfig 