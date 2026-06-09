import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set root to frontend/ so Turbopack doesn't
    // mistakenly pick up the monorepo root's package-lock.json
    root: path.join(__dirname),
  },
};

export default nextConfig;
