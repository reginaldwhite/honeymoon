import { NextResponse, type NextRequest } from "next/server";
import { checkPassword, clientKey } from "@/lib/login";
import { SESSION_COOKIE_NAME, isValidSessionCookieValue } from "@/lib/session";

/**
 * The query parameter that carries the password in a shared link, so a
 * recipient of `https://…/?key=…` is let straight in. The gate verifies it
 * exactly as the login form would, sets the session cookie, and redirects to
 * the same address with the key removed, so it does not linger in the
 * address bar or get copied onward.
 */
const LINK_KEY_PARAM = "key";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Dev-only local authoring tool — never intended to be reachable in
    // production (also enforced independently in app/admin/layout.tsx and
    // every admin route handler). Bypasses the site password gate entirely.
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = await isValidSessionCookieValue(cookie);

  const linkKey = searchParams.get(LINK_KEY_PARAM);
  if (linkKey !== null) {
    // Whether or not the key is good, the redirect drops it from the URL; a
    // bad one then just lands on the login page like any other visitor.
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(LINK_KEY_PARAM);
    if (!isAuthenticated) {
      const result = await checkPassword(linkKey, clientKey(request.headers));
      if (result.ok) {
        const destination = isLoginPage
          ? new URL(safeFrom(searchParams.get("from")), request.url)
          : clean;
        const response = NextResponse.redirect(destination);
        response.cookies.set(result.cookie.name, result.cookie.value, result.cookie.options);
        return response;
      }
    }
    if (isAuthenticated) return NextResponse.redirect(clean);
    isAuthenticated = false;
  }

  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function safeFrom(from: string | null): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
