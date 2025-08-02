import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { hasUserProfile } from './lib/actions/user.actions';
import { areAllApprovalsComplete } from './lib/actions/approval.actions';
import { getUserOfficialInfo } from './lib/actions/middleware-helpers';

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
  // Get official info from database (primary source of truth)
  const officialInfo = await getUserOfficialInfo(userId);
  const isOfficial = officialInfo.isOfficial;
  const dbUserRole = officialInfo.role;
  
  // Fallback to Clerk metadata if database doesn't have the user
  const clerkUserRole = sessionClaims?.publicMetadata?.role;
  const userRole = dbUserRole || clerkUserRole;
  
  console.log('Middleware Debug:', {
    userId,
    isOfficial,
    dbUserRole,
    clerkUserRole,
    finalUserRole: userRole,
    pathname: req.nextUrl.pathname,
    officialInfo
  });
  
  let onboardingComplete = sessionClaims?.publicMetadata?.onboardingComplete === true;

  // If session is stale, check the database as the source of truth.
  if (!onboardingComplete) {
    if (isOfficial) {
      // For officials, they're onboarded if they exist in officials table
      onboardingComplete = true;
    } else {
      // For students, check if they have a profile
      onboardingComplete = await hasUserProfile(userId);
    }
  }

  const approvalStatus = sessionClaims?.publicMetadata?.approvalStatus;
  const isAtOnboarding = req.nextUrl.pathname.startsWith('/onboarding');
  const isAtPending = req.nextUrl.pathname.startsWith('/pending-approval');

  // 1. For officials, skip onboarding entirely if they exist in officials table
  if (isOfficial && onboardingComplete) {
    // Skip onboarding logic for officials - go directly to role-based routing
  } else if (!onboardingComplete && !isAtOnboarding) {
    // For students or officials not in database, redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // 2. If onboarding IS complete, handle redirects based on status.
  if (onboardingComplete) {
    if (isOfficial) {
      // For officials, redirect to their appropriate dashboard
      const isAtOfficialRoute = req.nextUrl.pathname.match(/^\/(hs|cse|csm|csd|ece)\/hod\/(dashboard|club-applications)/) ||
                                req.nextUrl.pathname.match(/^\/(tpo|dean|director)\/(dashboard|club-applications)/);
      
      if (!isAtOfficialRoute && !isAtOnboarding && !isAtPending) {
        // Redirect to appropriate dashboard based on role
        if (userRole && userRole.includes('_hod')) {
          const dept = userRole.replace('_hod', '');
          return NextResponse.redirect(new URL(`/${dept}/hod/dashboard`, req.url));
        } else if (userRole) {
          return NextResponse.redirect(new URL(`/${userRole}/dashboard`, req.url));
        }
        // If no role available, redirect to sign-in
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    } else {
      // For students, use existing approval logic
      const allApprovalsComplete = await areAllApprovalsComplete(userId);
      
      // If not all approvals are complete, force redirect to pending-approval
      if (!allApprovalsComplete && !isAtPending) {
        return NextResponse.redirect(new URL('/pending-approval', req.url));
      }
      
      // If all approvals are complete and on restricted pages, redirect to dashboard
      if (allApprovalsComplete && (isAtOnboarding || isAtPending)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      
      // If onboarded but not all approvals complete, redirect to pending-approval
      if (isAtOnboarding) {
        return NextResponse.redirect(new URL('/pending-approval', req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
