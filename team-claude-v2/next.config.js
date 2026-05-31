/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'Team Claude',
    NEXT_PUBLIC_TEAM_NAME: process.env.NEXT_PUBLIC_TEAM_NAME || 'Lead with Tribe',
  },
};

module.exports = nextConfig;
