import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "subdomain" },
      { protocol: "https", hostname: "files.stripe.com" },
      { protocol: "https", hostname: "**.ufs.sh" }, // Allow all subdomains
      { protocol: "https", hostname: "ufs.sh" }, // (optional) root domain
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
