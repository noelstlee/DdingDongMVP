/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // ✅ Enables static export mode
  distDir: "out", // ✅ Ensures build output goes to "out/"
  images: {
    unoptimized: true, // ✅ Prevents Next.js from optimizing images (required for static export)
  },
  trailingSlash: true, // ✅ Ensures Firebase Hosting routes correctly
};

export default nextConfig;