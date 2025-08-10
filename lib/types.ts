// Type definitions for CMR Educational Group institutions
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

// Member-related types (unified single table design)
export interface ClubMember {
  id: string;
  club_name: string;
  college: College;
  name: string;
  roll_number?: string; // Optional for faculty/in-charge
  year?: 1 | 2 | 3 | 4; // Only for students
  department: Department;
  section?: string; // Only for students
  email?: string;
  phone?: string;
  role: string; // Flexible role (reserved: 'club_lead', 'incharge', 'member' or custom)
  is_active: boolean;
  // In-charge specific fields (only populated when role = 'incharge')
  incharge_name?: string; // Faculty name for in-charge
  incharge_phone?: string; // Faculty phone for in-charge
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClubCustomRole {
  id: string;
  club_name: string;
  college: College;
  role_name: string;
  role_description?: string;
  created_by: string; // Club lead who created this role
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Reserved roles that cannot be created as custom
export const RESERVED_ROLES = ['club_lead', 'incharge', 'member'] as const;
export type ReservedRole = typeof RESERVED_ROLES[number];

// Year options for students
export const STUDENT_YEARS = [1, 2, 3, 4] as const;
export const YEAR_NAMES: Record<number, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year'
};
