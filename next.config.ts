import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  // Do not tell everyone which framework (and so which known bugs) runs here.
  poweredByHeader: false,

  // Security headers on every response (see src/lib/security/headers.ts).
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
