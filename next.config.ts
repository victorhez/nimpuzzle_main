import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@nimiq/core', 'comlink', 'websocket'],
}

export default nextConfig
