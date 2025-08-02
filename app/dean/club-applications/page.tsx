import { redirect } from "next/navigation";
import { getCurrentOfficial, getCategorizedApplications, verifyOfficialAccess } from "@/lib/actions/officials.actions";
import { OfficialSidebar } from "@/components/ui/official-sidebar";
import { ClubApplicationsContainer } from "@/components/ui/club-applications-container";

export default async function DeanClubApplications() {
  // Verify access
  const hasAccess = await verifyOfficialAccess('dean');
  if (!hasAccess) {
    redirect('/sign-in');
  }

  const official = await getCurrentOfficial();
  if (!official) {
    redirect('/sign-in');
  }

  // Get categorized applications (all departments for Dean)
  const applications = await getCategorizedApplications('dean');

  return (
    <div className="flex h-screen bg-gray-50">
      <OfficialSidebar 
        officialRole={official.official_role}
        displayName={official.display_name}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Club Applications</h1>
            <p className="text-gray-600 mt-2">
              Review and manage club applications from all departments as Dean.
            </p>
          </div>

          {/* Applications Container */}
          <ClubApplicationsContainer
            pending={applications.pending}
            approved={applications.approved}
            rejected={applications.rejected}
            officialRole="dean"
          />
        </div>
      </main>
    </div>
  );
}
