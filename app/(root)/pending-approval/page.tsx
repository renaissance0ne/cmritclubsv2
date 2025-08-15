import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/user.actions';
import { getDetailedApprovalStatus } from '@/lib/actions/approval.actions';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, User, Mail, Phone, GraduationCap, Building, Calendar, FileText, ExternalLink } from 'lucide-react';

const OFFICIAL_DISPLAY_NAMES: Record<string, string> = {
  'hs_hod': 'H&S HOD',
  'cse_hod': 'CSE HOD',
  'csm_hod': 'CSM HOD', 
  'csd_hod': 'CSD HOD',
  'ece_hod': 'ECE HOD',
  'tpo': 'TPO',
  'dean': 'Dean',
  'director': 'Director'
};

function ApprovalStatusIcon({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-600" />;
  }
}

function ApprovalStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | undefined }) {
  const safeStatus = status || 'pending';
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300'
  };
  
  return (
    <Badge className={`${variants[safeStatus]} border`}>
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </Badge>
  );
}

export default async function PendingApprovalPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const profileResult = await getUserProfile(user.id);

  if (!profileResult.success || !profileResult.data) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col justify-center py-20 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="text-muted-foreground">
            Could not retrieve your application status. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const profile = profileResult.data;
  const approvalResult = await getDetailedApprovalStatus(profile.id);
  
  if (!approvalResult.success) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col justify-center py-20 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="text-muted-foreground">
            Could not retrieve detailed approval status. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const approvalStatuses = approvalResult.data || {};
  
  // Extract overall status from the JSON structure
  let overallStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  
  if (profile.approval_status) {
    const approvalStatusJson = typeof profile.approval_status === 'string' 
      ? JSON.parse(profile.approval_status) 
      : profile.approval_status;
    
    // Check if overall_status exists in the JSON
    if (approvalStatusJson.overall_status) {
      overallStatus = approvalStatusJson.overall_status as 'pending' | 'approved' | 'rejected';
    } else {
      // If no overall_status, determine based on individual approvals
      const hasRejected = Object.values(approvalStatuses).some((status: any) => status.status === 'rejected');
      const allApproved = Object.values(approvalStatuses).every((status: any) => status.status === 'approved');
      
      if (hasRejected) {
        overallStatus = 'rejected';
      } else if (allApproved && Object.keys(approvalStatuses).length === Object.keys(OFFICIAL_DISPLAY_NAMES).length) {
        overallStatus = 'approved';
      } else {
        overallStatus = 'pending';
      }
    }
  }
  
  // Count approvals
  const totalOfficials = Object.keys(OFFICIAL_DISPLAY_NAMES).length;
  const approvedCount = Object.values(approvalStatuses).filter(status => status.status === 'approved').length;
  const rejectedCount = Object.values(approvalStatuses).filter(status => status.status === 'rejected').length;

  return (
    <main className="mx-auto max-w-6xl py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Club Application Status</h1>
          <div className="flex items-center justify-center gap-4">
            <StatusBadge status={overallStatus} />
            <span className="text-sm text-muted-foreground">
              {approvedCount}/{totalOfficials} Officials Approved
            </span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Club Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Club Lead Details
              </CardTitle>
              <CardDescription>
                Your submitted application information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{profile.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{user.emailAddresses[0]?.emailAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{profile.phone_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Roll Number:</span>
                  <span>{profile.roll_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Department:</span>
                  <span>{profile.department.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Year of Study:</span>
                  <span>{profile.year_of_study}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Club Name:</span>
                  <span className="font-semibold text-primary">{profile.club_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Faculty In-Charge:</span>
                  <span>{profile.faculty_in_charge}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Expected Graduation:</span>
                  <span>{new Date(profile.expected_graduation).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Proof Letter:</span>
                  <a 
                    href={profile.proof_letter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline flex items-center gap-1"
                  >
                    View Document
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Progress</CardTitle>
              <CardDescription>
                Status of approvals from all required officials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{totalOfficials - approvedCount - rejectedCount}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </div>
                </div>

                {/* Individual Official Statuses */}
                <div className="space-y-3">
                  <h4 className="font-medium">Official Approvals:</h4>
                  {Object.entries(OFFICIAL_DISPLAY_NAMES).map(([role, displayName]) => {
                    const status = approvalStatuses[role] || { status: 'pending' as const };
                    return (
                      <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <ApprovalStatusIcon status={status.status} />
                          <span className="font-medium">{displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ApprovalStatusBadge status={status.status} />
                          {status.date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(status.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Message */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              {overallStatus === 'pending' && (
                <>
                  <p className="text-lg font-medium">
                    Your application is currently under review.
                  </p>
                  <p className="text-muted-foreground">
                    You will gain access to the platform once all {totalOfficials} officials have approved your application.
                    Please wait for the review process to complete.
                  </p>
                </>
              )}
              {overallStatus === 'approved' && (
                <>
                  <p className="text-lg font-medium text-green-600">
                    🎉 Congratulations! Your application has been fully approved.
                  </p>
                  <p className="text-muted-foreground">
                    You now have complete access to the platform. You will be redirected to the dashboard shortly.
                  </p>
                </>
              )}
              {overallStatus === 'rejected' && (
                <>
                  <p className="text-lg font-medium text-red-600">
                    Your application has been rejected.
                  </p>
                  <p className="text-muted-foreground">
                    Please contact the administration for more information about the rejection.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
