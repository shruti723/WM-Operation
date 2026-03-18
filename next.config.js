

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable image optimization, as it requires a server
  images: { unoptimized: true }
}

module.exports = nextConfig