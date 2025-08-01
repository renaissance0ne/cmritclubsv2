export {}

// Create a type for the roles
export type Roles = 'admin' | 'hod' | 'dean' | 'tpo' | 'director' | 'mentor' | 'student'
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