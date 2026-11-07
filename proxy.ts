import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get("access_token")?.value);
  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!hasToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Images (the logos in public/, the app icons) stay reachable before sign-in.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico)$).*)"],
};
