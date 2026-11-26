import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Every page, but not Next.js internals (_next/static, _next/image) or
  // files with an extension (images, fonts, scripts, robots.txt ...): those
  // must load on the login page too, so they never go through the redirect.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
