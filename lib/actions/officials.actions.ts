"use server";

import { clerkClient, auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Official {
  id: string;
  clerk_id: string;
  display_name: string;
  email: string;
  official_role: string;
  role: string;
  status: string;
}

export interface ClubApplication {
  id: string;
  clerk_id: string;
  full_name: string;
  phone_number: string;
  roll_number: string;
  department: string;
  year_of_study: number;
  expected_graduation: string;
  club_name: string;
  faculty_in_charge: string;
  proof_letter_url: string;
  approval_status: any;
  created_at: string;
  updated_at: string;
}

// Get current official's details
export async function getCurrentOfficial() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const supabase = await createClient();
    const { data: official, error } = await supabase
      .from('officials')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) throw error;
    return official as Official;
  } catch (error) {
    console.error("Error getting current official:", error);
    return null;
  }
}

// Get club applications based on official's role and scope
export async function getClubApplicationsForOfficial(officialRole: string, department?: string) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // If it's a HOD, filter by department
    if (department && officialRole.includes('_hod')) {
      query = query.eq('department', department.toUpperCase());
    }

    const { data: applications, error } = await query;
    if (error) throw error;

    return applications as ClubApplication[];
  } catch (error) {
    console.error("Error getting club applications:", error);
    return [];
  }
}

// Get applications categorized by current official's review status
export async function getCategorizedApplications(officialRole: string, department?: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const applications = await getClubApplicationsForOfficial(officialRole, department);
    
    const pending: ClubApplication[] = [];
    const approved: ClubApplication[] = [];
    const rejected: ClubApplication[] = [];

    // Map official_role to approval_status key
    const roleKeyMap: Record<string, string> = {
      'hs_hod': 'hsHod',
      'cse_hod': 'cseHod',
      'csm_hod': 'csmHod',
      'csd_hod': 'csdHod',
      'ece_hod': 'eceHod',
      'tpo': 'tpo',
      'dean': 'dean',
      'director': 'director'
    };

    const statusKey = roleKeyMap[officialRole];
    if (!statusKey) {
      console.error("Unknown official role:", officialRole);
      return { pending, approved, rejected };
    }

    applications.forEach(app => {
      const approvalStatus = app.approval_status || {};
      const officialStatus = approvalStatus[statusKey];

      if (!officialStatus || !officialStatus.status) {
        pending.push(app);
      } else if (officialStatus.status === 'approved') {
        approved.push(app);
      } else if (officialStatus.status === 'rejected') {
        rejected.push(app);
      }
    });

    return { pending, approved, rejected };
  } catch (error) {
    console.error("Error categorizing applications:", error);
    return { pending: [], approved: [], rejected: [] };
  }
}

// Update application status by current official
export async function updateApplicationStatus(
  profileId: string,
  status: 'approved' | 'rejected',
  comments?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    // Get current official details
    const official = await getCurrentOfficial();
    if (!official) throw new Error("Official not found");

    const supabase = await createClient();

    // Get current application
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', profileId)
      .single();

    if (fetchError) throw fetchError;

    // Map official_role to approval_status key
    const roleKeyMap: Record<string, string> = {
      'hs_hod': 'hsHod',
      'cse_hod': 'cseHod',
      'csm_hod': 'csmHod',
      'csd_hod': 'csdHod',
      'ece_hod': 'eceHod',
      'tpo': 'tpo',
      'dean': 'dean',
      'director': 'director'
    };

    const statusKey = roleKeyMap[official.official_role];
    if (!statusKey) throw new Error("Invalid official role");

    // Update approval status
    const currentApprovalStatus = profile.approval_status || {};
    const updatedApprovalStatus = {
      ...currentApprovalStatus,
      [statusKey]: {
        status,
        comments: comments || null,
        updated_at: new Date().toISOString(),
        official_id: userId
      }
    };

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        approval_status: updatedApprovalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) throw updateError;

    // Revalidate relevant paths
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("Error updating application status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Verify official access to specific route
export async function verifyOfficialAccess(expectedRole: string, expectedDepartment?: string) {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const official = await getCurrentOfficial();
    if (!official) return false;

    // For HODs, check both role and department
    if (expectedRole.includes('_hod')) {
      const officialDept = official.official_role.replace('_hod', '');
      return official.official_role === expectedRole && 
             (!expectedDepartment || officialDept === expectedDepartment);
    }

    // For general officials, just check role
    return official.official_role === expectedRole;
  } catch (error) {
    console.error("Error verifying official access:", error);
    return false;
  }
}
