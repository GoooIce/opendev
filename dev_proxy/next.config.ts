import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  outputFileTracingIncludes: {
    '/api/sign': ['./lib/sign_bg.wasm'],
  },

  /* config options here */
};

export default nextConfig;
