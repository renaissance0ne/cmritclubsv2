export {}

// Create a type for the roles
export type Roles = 'admin' | 'hs_hod' | 'cse_hod' | 'csm_hod' | 'csd_hod' | 'ece_hod' | 'dean' | 'tpo' | 'director' | 'mentor' | 'student'
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata: {
      role?: Roles;
      onboardingComplete?: boolean;
      approvalStatus?: ApprovalStatus;
    }
  }
}