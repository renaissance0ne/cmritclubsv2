export {}

// Create a type for the roles
export type Roles = 'admin' | 'hs_hod' | 'cse_hod' | 'csm_hod' | 'csd_hod' | 'ece_hod' | 'dean' | 'tpo' | 'director' | 'mentor' | 'student'
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// College types for CMR Educational Group
export type College = 'cmrit' | 'cmrcet' | 'cmrtc' | 'cmrec';
export type Department = 'cse' | 'csm' | 'hs' | 'ece' | 'csd';
export type HODRole = 'cse_hod' | 'csm_hod' | 'hs_hod' | 'ece_hod' | 'csd_hod';
export type GeneralRole = 'tpo' | 'dean' | 'director' | 'admin';

// Route validation constants
export const VALID_COLLEGES: College[] = ['cmrit', 'cmrcet', 'cmrtc', 'cmrec'];
export const VALID_DEPARTMENTS: Department[] = ['cse', 'csm', 'hs', 'ece', 'csd'];
export const VALID_HOD_ROLES: HODRole[] = ['cse_hod', 'csm_hod', 'hs_hod', 'ece_hod', 'csd_hod'];
export const VALID_GENERAL_ROLES: GeneralRole[] = ['tpo', 'dean', 'director', 'admin'];

// College name mapping
export const COLLEGE_NAMES: Record<College, string> = {
  cmrit: 'CMR Institute of Technology',
  cmrcet: 'CMR College of Engineering & Technology',
  cmrtc: 'CMR Technical Campus',
  cmrec: 'CMR Engineering College'
};

// Department name mapping
export const DEPARTMENT_NAMES: Record<Department, string> = {
  cse: 'Computer Science & Engineering',
  csm: 'Computer Science & Machine Learning',
  hs: 'Humanities & Sciences',
  ece: 'Electronics & Communication Engineering',
  csd: 'Computer Science & Data Science'
};

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata: {
      role?: Roles;
      onboardingComplete?: boolean;
      approvalStatus?: ApprovalStatus;
    }
  }
}