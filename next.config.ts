import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL,
    API_KEY: process.env.API_KEY,
  },
};

export default nextConfig;
