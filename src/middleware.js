import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/account-billing(.*)",
]);

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://www.googletagmanager.com https://www.google-analytics.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://challenges.cloudflare.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://api.clerk.dev https://www.google-analytics.com https://analytics.google.com",
  "img-src 'self' data: blob: https://img.clerk.com https://images.unsplash.com https://unsplash.com https://images.pexels.com https://res.cloudinary.com https://cdn.shopify.com https://thecupcakedesire.com.au https://www.youtube.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://maps.google.com",
  "form-action *",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
].join("; ")

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Always send guests to our branded /sign-in — never Clerk Account Portal
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  const response = NextResponse.next();

  // Override whatever CSP Clerk sets with our complete, correct one
  response.headers.set("content-security-policy", cspHeader);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|api/stripe/webhook|order-successful|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|woff2?|ico)).*)",
  ],
};