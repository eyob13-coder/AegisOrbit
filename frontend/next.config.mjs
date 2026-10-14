/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // R3F instancing operates smoothest with single mounting
  transpilePackages: ['three'],
  turbopack: {},
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;
