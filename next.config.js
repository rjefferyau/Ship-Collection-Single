/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: '.next',
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
    if (dev) {
      // Use faster source maps in development
      config.devtool = 'eval';
      
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
  // Disable file system watching for specific directories
  experimental: {
    // Valid experimental options for Next.js 13.5.8
    workerThreads: false,
    // Reduce file system operations
    swcMinify: true,
    // Disable font optimization (using a valid property)
    optimizeCss: false,
  },
  // Reduce the number of pages that are pre-rendered at once
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig 