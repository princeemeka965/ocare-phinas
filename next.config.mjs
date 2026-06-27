/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Load native/dynamic-require image libs at runtime instead of bundling them
  // (potrace pulls in jimp; bundling breaks the category-icon trace pipeline).
  serverExternalPackages: ["sharp", "potrace"],
  // sharp's libvips .so is loaded via dlopen, which the serverless file tracer
  // can't follow — without this the binary is missing at runtime on linux-x64.
  // Force the native packages into the function bundle for the admin API routes.
  outputFileTracingIncludes: {
    "/api/admin/**": [
      "./node_modules/@img/sharp-libvips-linux-x64/**",
      "./node_modules/@img/sharp-linux-x64/**",
    ],
  },
};

export default nextConfig;
