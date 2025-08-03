import { getCategorizedApplications } from '@/lib/actions/officials.actions';
import { ClubApplicationsContainer } from './club-applications-container';
import { College, Department, HODRole, GeneralRole } from '@/types/globals';

interface ClubApplicationsServerWrapperProps {
  officialRole: HODRole | GeneralRole;
  college: College;
  department?: Department;
}

export async function ClubApplicationsServerWrapper({ 
  officialRole, 
  college, 
  department 
}: ClubApplicationsServerWrapperProps) {
  try {
    // Fetch categorized applications based on role and college
    const applications = await getCategorizedApplications(officialRole, department);
    
    return (
      <ClubApplicationsContainer
        pending={applications.pending}
        approved={applications.approved}
        rejected={applications.rejected}
        officialRole={officialRole}
        college={college}
        department={department}
      />
    );
  } catch (error) {
    console.error('Error fetching applications:', error);
    
    // Return container with empty data on error
    return (
      <ClubApplicationsContainer
        officialRole={officialRole}
        college={college}
        department={department}
      />
    );
  }
}
