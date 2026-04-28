import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/share",
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    if (isPublicPath) return NextResponse.next();

    const isAuthenticated = request.cookies.get("is_authenticated")?.value;

    if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
