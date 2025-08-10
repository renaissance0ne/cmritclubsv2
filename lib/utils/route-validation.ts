import { 
  College, 
  Department, 
  HODRole, 
  GeneralRole,
  VALID_COLLEGES,
  VALID_DEPARTMENTS,
  VALID_HOD_ROLES,
  VALID_GENERAL_ROLES,
  COLLEGE_NAMES,
  DEPARTMENT_NAMES
} from '../types';

/**
 * Interface for route validation results
 */
export interface RouteValidation {
  isValid: boolean;
  error?: string;
  college?: College;
  department?: Department;
  role?: HODRole | GeneralRole;
}

/**
 * Interface for breadcrumb navigation items
 */
export interface Breadcrumb {
  label: string;
  href: string;
}

/**
 * Validates if a college code is valid
 */
export function isValidCollege(college: string): college is College {
  return VALID_COLLEGES.includes(college as College);
}

/**
 * Validates if a department code is valid
 */
export function isValidDepartment(department: string): department is Department {
  return VALID_DEPARTMENTS.includes(department as Department);
}

/**
 * Validates if a role is a valid HOD role
 */
export function isValidHODRole(role: string): role is HODRole {
  return VALID_HOD_ROLES.includes(role as HODRole);
}

/**
 * Validates if a role is a valid general official role
 */
export function isValidGeneralRole(role: string): role is GeneralRole {
  return VALID_GENERAL_ROLES.includes(role as GeneralRole);
}

/**
 * Validates if a department matches the HOD role
 */
export function isDepartmentRoleMatch(department: Department, role: HODRole): boolean {
  const expectedRole = `${department}_hod` as HODRole;
  return role === expectedRole;
}

/**
 * Gets the college display name
 */
export function getCollegeName(college: College): string {
  return COLLEGE_NAMES[college];
}

/**
 * Gets the department display name
 */
export function getDepartmentName(department: Department): string {
  return DEPARTMENT_NAMES[department];
}

/**
 * Validates a complete HOD route
 */
export function validateHODRoute(college: string, department: string, role: string): {
  isValid: boolean;
  college?: College;
  department?: Department;
  role?: HODRole;
  error?: string;
} {
  if (!isValidCollege(college)) {
    return { isValid: false, error: 'Invalid college code' };
  }

  if (!isValidDepartment(department)) {
    return { isValid: false, error: 'Invalid department code' };
  }

  if (!isValidHODRole(role)) {
    return { isValid: false, error: 'Invalid HOD role' };
  }

  if (!isDepartmentRoleMatch(department, role)) {
    return { isValid: false, error: 'Department and role do not match' };
  }

  return {
    isValid: true,
    college,
    department,
    role
  };
}

/**
 * Validates a complete general official route
 */
export function validateGeneralRoute(college: string, role: string): {
  isValid: boolean;
  college?: College;
  role?: GeneralRole;
  error?: string;
} {
  if (!isValidCollege(college)) {
    return { isValid: false, error: 'Invalid college code' };
  }

  if (!isValidGeneralRole(role)) {
    return { isValid: false, error: 'Invalid general role' };
  }

  return {
    isValid: true,
    college,
    role
  };
}

/**
 * Validates a club leader route
 */
export function validateClubRoute(college: string): {
  isValid: boolean;
  college?: College;
  error?: string;
} {
  if (!isValidCollege(college)) {
    return { isValid: false, error: 'Invalid college code' };
  }

  return {
    isValid: true,
    college
  };
}

/**
 * Generates breadcrumb data for routes
 */
export function generateBreadcrumbs(college: College, department?: Department, role?: HODRole | GeneralRole) {
  const breadcrumbs = [
    { label: getCollegeName(college), href: `/${college}` }
  ];

  if (department && role && isValidHODRole(role)) {
    breadcrumbs.push(
      { label: getDepartmentName(department), href: `/${college}/${department}` },
      { label: role.toUpperCase(), href: `/${college}/${department}/${role}` },
      { label: 'Dashboard', href: `/${college}/${department}/${role}/dashboard` }
    );
  } else if (role && isValidGeneralRole(role)) {
    breadcrumbs.push(
      { label: role.toUpperCase(), href: `/${college}/${role}` },
      { label: 'Dashboard', href: `/${college}/${role}/dashboard` }
    );
  } else {
    breadcrumbs.push(
      { label: 'Dashboard', href: `/${college}/dashboard` }
    );
  }

  return breadcrumbs;
}

/**
 * Validates consistent route structure: [college]/[type]/[identifier]
 */
export function validateConsistentRoute(college: string, type: string, identifier: string): RouteValidation {
  // Validate college
  if (!isValidCollege(college)) {
    return { isValid: false, error: 'Invalid college code' };
  }

  // Validate type and identifier combination
  if (type === 'hod') {
    // For HODs, identifier should be a valid HOD role
    if (!isValidHODRole(identifier)) {
      return { isValid: false, error: 'Invalid HOD role' };
    }
    // Verify department-role matching
    const department = identifier.replace('_hod', '') as Department;
    if (!isValidDepartment(department)) {
      return { isValid: false, error: 'Invalid department in HOD role' };
    }
    return { isValid: true, college: college as College, department, role: identifier as HODRole };
  } else if (type === 'official') {
    // For general officials, identifier should be a valid general role
    if (!isValidGeneralRole(identifier)) {
      return { isValid: false, error: 'Invalid general role' };
    }
    return { isValid: true, college: college as College, role: identifier as GeneralRole };
  }

  return { isValid: false, error: 'Invalid route type' };
}

/**
 * Validates an official route for letters management
 */
export async function validateOfficialRoute(college: string, type: string, identifier: string): Promise<RouteValidation> {
  // Use the existing validateConsistentRoute function
  const validation = validateConsistentRoute(college, type, identifier);
  
  // Additional validation for official routes
  if (!validation.isValid) {
    return validation;
  }

  // Ensure this is an official route (hod or official type)
  if (type !== 'hod' && type !== 'official') {
    return {
      isValid: false,
      error: 'Invalid route type for official access'
    };
  }

  return {
    isValid: true,
    college: validation.college,
    department: validation.department,
    role: validation.role
  };
}

/**
 * Generates breadcrumb navigation for consistent route structure
 */
export function generateConsistentBreadcrumbs(
  college: College, 
  type: string, 
  identifier: string, 
  page?: string
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: COLLEGE_NAMES[college], href: `/${college}` }
  ];

  if (type === 'hod') {
    const department = identifier.replace('_hod', '') as Department;
    breadcrumbs.push(
      { label: `${DEPARTMENT_NAMES[department]} HOD`, href: `/${college}/${type}/${identifier}` }
    );
  } else if (type === 'official') {
    const roleNames: Record<string, string> = {
      tpo: 'TPO',
      dean: 'Dean',
      director: 'Director',
      admin: 'Admin'
    };
    breadcrumbs.push(
      { label: roleNames[identifier] || identifier.toUpperCase(), href: `/${college}/${type}/${identifier}` }
    );
  }

  // Add page-specific breadcrumb
  if (page === 'club-applications') {
    breadcrumbs.push(
      { label: 'Dashboard', href: `/${college}/${type}/${identifier}/dashboard` },
      { label: 'Club Applications', href: `/${college}/${type}/${identifier}/club-applications` }
    );
  } else {
    breadcrumbs.push(
      { label: 'Dashboard', href: `/${college}/${type}/${identifier}/dashboard` }
    );
  }

  return breadcrumbs;
}
