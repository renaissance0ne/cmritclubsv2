import { OfficialSidebar } from '@/components/ui/official-sidebar';
import { ClubApplicationsContainer } from '@/components/ui/club-applications-container';
import { getCurrentOfficial, verifyOfficialAccess, getCategorizedApplications } from '@/lib/actions/officials.actions';
import { redirect } from 'next/navigation';

export default async function CSDHODClubApplications() {
  // Verify access
  const hasAccess = await verifyOfficialAccess('csd_hod', 'csd');
  if (!hasAccess) {
    redirect('/sign-in');
  }

  // Get current official details
  const official = await getCurrentOfficial();
  if (!official) {
    redirect('/sign-in');
  }

  // Get applications for CSD department
  const applications = await getCategorizedApplications('csd_hod', 'csd');

  return (
    <div className="flex h-screen bg-gray-50">
      <OfficialSidebar 
        department="csd"
        officialRole={official.official_role}
        displayName={official.display_name}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Club Applications</h1>
              <p className="text-gray-600">All Department Applications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-medium text-gray-900">{official.display_name}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <ClubApplicationsContainer
            pending={applications.pending}
            approved={applications.approved}
            rejected={applications.rejected}
            officialRole="csd_hod"
            department="csd"
          />
        </main>
      </div>
    </div>
  );
}
