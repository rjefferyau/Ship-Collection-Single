/** @type {import('next').NextConfig} */
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (error) {
  console.warn('Bundle analyzer not available, skipping...');
}

const nextConfig = {
  reactStrictMode: false,
  distDir: '.next',
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  // Optimize for file locking issues
  onDemandEntries: {
    // Keep pages in memory for longer (default is 15 seconds)
    maxInactiveAge: 120 * 1000,
    // Number of pages to keep in memory (default is 5)
    pagesBufferLength: 4,
  },
  // Optimize webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add fallbacks for Node.js modules in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Let Next.js handle devtool settings for optimal performance
    
    if (dev) {
      // Reduce the number of webpack loaders
      config.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((r) => {
            if (r.use && Array.isArray(r.use)) {
              r.use = r.use.map((u) => {
                if (typeof u === 'object' && u.loader && u.loader.includes('css-loader') && !u.loader.includes('postcss-loader')) {
                  if (u.options) {
                    // Reduce CSS processing in development
                    u.options.sourceMap = false;
                  }
                }
                return u;
              });
            }
          });
        }
      });
    }
    
    // Disable some plugins in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          cacheGroups: {
            default: false,
            vendors: false,
            // Add a new cache group for large dependencies
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Add a specific cache group for react
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
          },
        },
        runtimeChunk: false,
      };
    }
    
    return config;
  },
  // Reduce the frequency of type checking to prevent file locks
  typescript: {
    // Disable type checking during development to reduce file operations
    // You should run type checking manually with `npm run type-check` instead
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Show ESLint warnings but don't fail the build
    ignoreDuringBuilds: true,
  },
  // Updated experimental options for latest Next.js
  experimental: {
    // Valid experimental options for latest Next.js
    workerThreads: false,
  },
  // Reduce the number of pages that are pre-rendered at once
  staticPageGenerationTimeout: 120,
}

module.exports = withBundleAnalyzer(nextConfig); 