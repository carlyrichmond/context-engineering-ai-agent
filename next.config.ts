import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the Turbopack workspace root to the project directory so it does not
    // walk up into the home directory and pick up unrelated lockfiles.
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.weatherapi.com",
        port: "",
        pathname: "/weather/64x64/*/*.png",
        search: ""
      }
    ]
  }
};

export default nextConfig;
