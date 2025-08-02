import { redirect } from "next/navigation";
import { getCurrentOfficial, getCategorizedApplications, verifyOfficialAccess } from "@/lib/actions/officials.actions";
import { OfficialSidebar } from "@/components/ui/official-sidebar";
import { ClubApplicationsContainer } from "@/components/ui/club-applications-container";

export default async function CSMHODClubApplications() {
  // Verify access
  const hasAccess = await verifyOfficialAccess('csm_hod', 'csm');
  if (!hasAccess) {
    redirect('/sign-in');
  }

  const official = await getCurrentOfficial();
  if (!official) {
    redirect('/sign-in');
  }

  // Get categorized applications
  const applications = await getCategorizedApplications('csm_hod', 'csm');

  return (
    <div className="flex h-screen bg-gray-50">
      <OfficialSidebar 
        officialRole={official.official_role}
        displayName={official.display_name}
        department="csm"
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CSM Club Applications</h1>
            <p className="text-gray-600 mt-2">
              Review and manage club applications from CSM department students.
            </p>
          </div>

          {/* Applications Container */}
          <ClubApplicationsContainer
            pending={applications.pending}
            approved={applications.approved}
            rejected={applications.rejected}
            officialRole="csm_hod"
            department="csm"
          />
        </div>
      </main>
    </div>
  );
}
