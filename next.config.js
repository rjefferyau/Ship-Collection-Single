/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === 'development' ? 'dev-build' : '.next',
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig 