/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle per-kite JSON files with serverless functions so /api/kites
  // and on-demand server renders can read them at runtime.
  outputFileTracingIncludes: {
    '/**': ['./data/kites/**/*.json'],
  },
  // Retired kite slugs: keep old links and search results pointing somewhere real.
  async redirects() {
    return [
      // North's 2026 range is Orbit + Orbit Ultra; there is no 2026 Orbit Pro.
      { source: '/kite/north-orbit-pro-2026', destination: '/kite/north-orbit-2026', permanent: true },
      // Duplicate of flysurfer-era-2025, which is the Era 2.
      { source: '/kite/flysurfer-era-2-2026', destination: '/kite/flysurfer-era-2025', permanent: true },
    ];
  },
};

export default nextConfig;
