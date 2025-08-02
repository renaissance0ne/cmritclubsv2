import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OfficialSidebar } from '@/components/ui/official-sidebar';
import { getCurrentOfficial, verifyOfficialAccess } from '@/lib/actions/officials.actions';
import { redirect } from 'next/navigation';

export default async function CSDHODDashboard() {
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
              <h1 className="text-2xl font-bold text-gray-900">CSD HOD Dashboard</h1>
              <p className="text-gray-600">Computer Science & Design Department</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="font-medium text-gray-900">{official.display_name}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">CSD</div>
                  <p className="text-xs text-gray-500">Computer Science & Design</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">HOD</div>
                  <p className="text-xs text-gray-500">Head of Department</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Access Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">All Departments</div>
                  <p className="text-xs text-gray-500">Review All Applications</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Club Applications</CardTitle>
                  <CardDescription>
                    Review and manage club applications from CSD department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link 
                    href="/csd/hod/club-applications"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    View Applications
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>
                    Quick overview of CSD department activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Monitor club activities and approvals specific to the Computer Science & Design department.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
