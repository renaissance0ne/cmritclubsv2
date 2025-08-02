import { redirect } from "next/navigation";
import { getCurrentOfficial, verifyOfficialAccess } from "@/lib/actions/officials.actions";
import { OfficialSidebar } from "@/components/ui/official-sidebar";
import { Button } from "@/components/ui/button";
import { FileText, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function HSHODDashboard() {
  // Verify access
  const hasAccess = await verifyOfficialAccess('hs_hod', 'hs');
  if (!hasAccess) {
    redirect('/sign-in');
  }

  const official = await getCurrentOfficial();
  if (!official) {
    redirect('/sign-in');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OfficialSidebar 
        officialRole={official.official_role}
        displayName={official.display_name}
        department="hs"
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">H&S HOD Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {official.display_name}. Manage H&S department club applications.
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department</p>
                  <p className="text-2xl font-bold text-gray-900">H&S</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Role</p>
                  <p className="text-2xl font-bold text-gray-900">HOD</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-green-600">Active</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Action */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review Club Applications
              </h2>
              <p className="text-gray-600 mb-6">
                Review and approve club applications from H&S department students.
              </p>
              <Link href="/hs/hod/club-applications">
                <Button size="lg" className="px-8">
                  <FileText className="w-5 h-5 mr-2" />
                  View Club Applications
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
