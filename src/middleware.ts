import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Protects the admin UI and all non-public API routes.
// Public (mobile app) endpoints and the auth endpoints stay open.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isPublicApi =
    pathname.startsWith("/api/public") || pathname.startsWith("/api/auth");

  // Let public + auth APIs through untouched.
  if (isApi && isPublicApi) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (session) return NextResponse.next();

  // Not authenticated.
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Guard the admin pages and the internal API. Public API + auth handled above.
  matcher: ["/admin/:path*", "/api/:path*"],
};
