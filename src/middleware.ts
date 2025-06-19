// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware((auth, req: NextRequest) => {
  const url = req.nextUrl;
  const searchParams = url.searchParams.toString();
  const pathWithSearchParams = `${url.pathname}${
    searchParams ? `?${searchParams}` : ""
  }`;

  const host = req.headers.get("host") || "";
  const baseDomain = process.env.NEXT_PUBLIC_DOMAIN || "example.com";

  const customSubDomain = host
    .split(`.${baseDomain}`)[0]
    .replace(`.${baseDomain}`, "")
    .trim();

  // If a custom subdomain is detected, rewrite the path accordingly
  if (
    customSubDomain &&
    customSubDomain !== "www" &&
    customSubDomain !== baseDomain
  ) {
    return NextResponse.rewrite(
      new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
    );
  }

  // Redirect unauthenticated users to the agency sign-in page
  if (url.pathname === "/sign-in" || url.pathname === "/sign-up") {
    return NextResponse.redirect(new URL(`/agency/sign-in`, req.url));
  }

  // Serve the default site when no subdomain is present
  if (
    url.pathname === "/" ||
    (url.pathname === "/site" && host === baseDomain)
  ) {
    return NextResponse.rewrite(new URL("/site", req.url));
  }

  // Allow other paths to proceed normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
