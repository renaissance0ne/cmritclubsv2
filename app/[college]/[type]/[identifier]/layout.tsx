import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OfficialSidebar } from '@/components/ui/official-sidebar';
import { validateConsistentRoute } from '@/lib/utils/route-validation';
import { getUserOfficialInfo } from '@/lib/actions/middleware-helpers';

interface OfficialLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    college: string;
    type: string;
    identifier: string;
  }>;
}

export default async function OfficialLayout({ children, params }: OfficialLayoutProps) {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect('/sign-in');
  }

  const { college, type, identifier } = await params;
  
  // Validate the route parameters
  const validation = validateConsistentRoute(college, type, identifier);
  if (!validation.isValid) {
    redirect('/404');
  }

  // Get official info and verify access
  const officialInfo = await getUserOfficialInfo(userId);
  if (!officialInfo.isOfficial) {
    redirect('/dashboard');
  }

  // Verify user has access to this specific route
  const hasAccess = verifyRouteAccess(officialInfo, college, type, identifier);
  if (!hasAccess) {
    redirect('/dashboard');
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : officialInfo.displayName || user.username || user.emailAddresses[0]?.emailAddress || 'Official';

  return (
    <div className="flex h-screen bg-gray-100">
      <OfficialSidebar 
        officialRole={officialInfo.role || identifier}
        displayName={displayName}
        department={validation.department}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Helper function to verify route access
function verifyRouteAccess(
  officialInfo: { role?: string; college?: string },
  college: string,
  type: string,
  identifier: string
): boolean {
  // For HOD routes, verify the role matches
  if (type === 'hod') {
    return officialInfo.role === identifier;
  }
  
  // For general official routes, verify the role matches
  if (type === 'official') {
    return officialInfo.role === identifier;
  }
  
  return false;
}
