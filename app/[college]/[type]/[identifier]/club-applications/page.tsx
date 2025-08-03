import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getUserOfficialInfo } from '@/lib/actions/middleware-helpers';
import { College, HODRole, GeneralRole } from '@/types/globals';
import { validateConsistentRoute, generateConsistentBreadcrumbs } from '@/lib/utils/route-validation';
import { ClubApplicationsServerWrapper } from '@/components/ui/club-applications-server-wrapper';

interface ConsistentClubApplicationsPageProps {
  params: Promise<{
    college: string;
    type: string;
    identifier: string;
  }>;
}

export default async function ConsistentClubApplicationsPage({ params }: ConsistentClubApplicationsPageProps) {
  const { college, type, identifier } = await params;
  
  // Validate route parameters
  const validation = validateConsistentRoute(college, type, identifier);
  if (!validation.isValid) {
    notFound();
  }

  // Get current user
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Get official info and verify access
  const officialInfo = await getUserOfficialInfo(user.id);
  if (!officialInfo.isOfficial) {
    redirect('/dashboard');
  }

  // Verify user has access to this specific route
  const hasAccess = verifyRouteAccess(officialInfo, college, type, identifier);
  if (!hasAccess) {
    redirect('/dashboard');
  }

  // Generate breadcrumbs
  const breadcrumbs = generateConsistentBreadcrumbs(college as College, type, identifier, 'club-applications');

  // Determine page title based on type
  const pageConfig = getPageConfig(type, identifier);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <a
                  href={crumb.href}
                  className={`ml-1 text-sm font-medium ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-700 hover:text-gray-900'
                  } md:ml-2`}
                >
                  {crumb.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Page Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{pageConfig.title}</h1>
            <p className="mt-1 text-sm text-gray-600">{pageConfig.description}</p>
          </div>
        </div>

        {/* Club Applications Content */}
        <ClubApplicationsServerWrapper 
          college={college as College}
          officialRole={(officialInfo.role || 'admin') as HODRole | GeneralRole}
        />
      </div>
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
  // Verify college matches
  if (officialInfo.college !== college) {
    return false;
  }

  // Verify role access based on type and identifier
  if (type === 'hod') {
    return officialInfo.role === identifier;
  } else if (type === 'official') {
    return officialInfo.role === identifier;
  }

  return false;
}

// Helper function to get page configuration
function getPageConfig(type: string, identifier: string) {
  if (type === 'hod') {
    const department = identifier.replace('_hod', '').toUpperCase();
    return {
      title: `${department} Club Applications`,
      description: `Review and manage club applications from the ${department} department`
    };
  } else if (type === 'official') {
    const roleNames: Record<string, string> = {
      tpo: 'Training & Placement Officer',
      dean: 'Dean',
      director: 'Director',
      admin: 'Administrator'
    };
    return {
      title: `Club Applications - ${roleNames[identifier] || identifier.toUpperCase()}`,
      description: 'Review and manage club applications from all departments'
    };
  }

  return {
    title: 'Club Applications',
    description: 'Review and manage club applications'
  };
}
