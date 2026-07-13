/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle per-kite JSON files with serverless functions so /api/kites
  // and on-demand server renders can read them at runtime.
  outputFileTracingIncludes: {
    '/**': ['./data/kites/**/*.json'],
  },
};

export default nextConfig;
