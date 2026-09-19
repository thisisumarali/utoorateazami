/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    // Unoptimized allows client browsers to fetch remote WordPress images directly,
    // completely eliminating server-side 7-second fetch timeouts and 500 errors.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utoorateazami.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

