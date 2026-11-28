import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  // Do not tell everyone which framework (and so which known bugs) runs here.
  poweredByHeader: false,

  // Security headers on every response (see src/lib/security/headers.ts).
  async headers() {
    const headers = securityHeaders({
      dev: process.env.NODE_ENV !== "production",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
