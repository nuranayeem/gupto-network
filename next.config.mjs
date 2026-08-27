/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/profile-media/:userId/:filename",
          destination: "/api/profile/media/file/:userId/:filename",
        },
        {
          source: "/uploads/story-media/:userId/:filename",
          destination: "/api/stories/media/file/:userId/:filename",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
