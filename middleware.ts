import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { hasUserProfile } from './lib/actions/user.actions';

// Define public routes that don't require authentication.
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/onboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // For public routes, we do nothing.
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes, we must await the auth() call to get user details.
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    // Redirect unauthenticated users to the sign-in page.
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // --- Definitive Redirection Logic ---
  let onboardingComplete = sessionClaims?.publicMetadata?.onboardingComplete === true;

  // If session is stale, check the database as the source of truth.
  if (!onboardingComplete) {
    onboardingComplete = await hasUserProfile(userId);
  }

  const approvalStatus = sessionClaims?.publicMetadata?.approvalStatus;
  const isAtOnboarding = req.nextUrl.pathname.startsWith('/onboarding');
  const isAtPending = req.nextUrl.pathname.startsWith('/pending-approval');

  // 1. If onboarding is not complete, they MUST be at /onboarding.
  if (!onboardingComplete && !isAtOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // 2. If onboarding IS complete, handle redirects based on status.
  if (onboardingComplete) {
    // If pending and not at the pending page, redirect there.
    if (approvalStatus === 'pending' && !isAtPending) {
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }
    // If approved and on a restricted page, redirect to dashboard.
    if (approvalStatus === 'approved' && (isAtOnboarding || isAtPending)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If onboarded and trying to access onboarding, redirect away.
    if (isAtOnboarding) {
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
