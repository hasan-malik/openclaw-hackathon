/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["node-telegram-bot-api"]
  }
};

export default nextConfig;
