/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Load native/dynamic-require image libs at runtime instead of bundling them
  // (potrace pulls in jimp; bundling breaks the category-icon trace pipeline).
  serverExternalPackages: ["sharp", "potrace"],
};

export default nextConfig;
