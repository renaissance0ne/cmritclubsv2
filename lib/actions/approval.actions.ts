"use server";

import { clerkClient, auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REQUIRED_APPROVALS = [
  'hs_hod',    // H&S HOD
  'cse_hod',   // CSE HOD  
  'csm_hod',   // CSM HOD
  'csd_hod',   // CSD HOD
  'ece_hod',   // ECE HOD
  'tpo',       // TPO
  'dean',      // Dean
  'director'   // Director
];

// Action for an official to approve or reject a request
// Get detailed approval status for a profile
export async function getDetailedApprovalStatus(profileId: string) {
  try {
    const supabase = await createClient();
    
    // Get all approvals for this profile
    const { data: approvals, error } = await supabase
      .from('approvals')
      .select('official_role, status, comment, created_at')
      .eq('profile_id', profileId);

    if (error) throw error;

    // Create a map of official statuses
    const approvalMap: Record<string, { status: 'pending' | 'approved' | 'rejected', comment?: string, date?: string }> = {};
    
    // Initialize all required approvals as pending
    REQUIRED_APPROVALS.forEach(role => {
      approvalMap[role] = { status: 'pending' };
    });
    
    // Update with actual approvals
    approvals?.forEach(approval => {
      if (REQUIRED_APPROVALS.includes(approval.official_role)) {
        approvalMap[approval.official_role] = {
          status: approval.status as 'approved' | 'rejected',
          comment: approval.comment,
          date: approval.created_at
        };
      }
    });
    
    return { success: true, data: approvalMap };
  } catch (error) {
    console.error('Error getting detailed approval status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Check if all required approvals are complete for a user
export async function areAllApprovalsComplete(clerkId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // First get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, approval_status')
      .eq('clerk_id', clerkId)
      .single();
    
    if (profileError || !profile) return false;
    
    // If already marked as approved in profile, double-check with approvals table
    if (profile.approval_status !== 'approved') return false;
    
    // Get all approvals for this profile
    const { data: approvals, error: approvalsError } = await supabase
      .from('approvals')
      .select('official_role, status')
      .eq('profile_id', profile.id)
      .eq('status', 'approved');
    
    if (approvalsError) return false;
    
    // Check if all required roles have approved
    const approvedRoles = approvals?.map(a => a.official_role) || [];
    return REQUIRED_APPROVALS.every(role => approvedRoles.includes(role));
    
  } catch (error) {
    console.error('Error checking approval completeness:', error);
    return false;
  }
}

// Action for an official to approve or reject a request
export async function updateApprovalStatus({ profileId, newStatus, comment }: { profileId: string, newStatus: 'approved' | 'rejected', comment?: string }) {
    const { userId } = await auth();
    const user = await currentUser();
    const supabase = await createClient();

    // 1. Check for authentication and role
    if (!userId) throw new Error("Not authenticated");
    
    const officialRole = user?.publicMetadata?.role as string;
    if (!REQUIRED_APPROVALS.includes(officialRole)) {
        throw new Error("Not authorized to perform this action.");
    }

    try {
        // 2. Record the official's decision in the 'approvals' table
        const { error: approvalError } = await supabase.from('approvals').insert({
            profile_id: profileId,
            official_clerk_id: userId,
            official_role: officialRole,
            status: newStatus,
            comment: comment
        });

        if (approvalError) throw new Error(`Supabase approval error: ${approvalError.message}`);

        // 3. Handle rejection immediately
        if (newStatus === 'rejected') {
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ approval_status: 'rejected', rejection_reason: `${officialRole.toUpperCase()}: ${comment || 'No reason provided.'}` })
                .eq('id', profileId)
                .select('clerk_id')
                .single();
            
            if (updateError) throw updateError;

            // Update Clerk metadata for the rejected user
            await (await clerkClient()).users.updateUser(updatedProfile.clerk_id, {
                publicMetadata: { ...user?.publicMetadata, approvalStatus: 'rejected' }
            });
            
            revalidatePath('/dashboard');
            return { success: true, status: 'rejected' };
        }

        // 4. If approved, check if all required approvals are met
        const { data: allApprovals, error: fetchApprovalsError } = await supabase
            .from('approvals')
            .select('official_role')
            .eq('profile_id', profileId)
            .eq('status', 'approved');

        if (fetchApprovalsError) throw fetchApprovalsError;

        const approvedRoles = allApprovals.map(a => a.official_role);
        const allApproved = REQUIRED_APPROVALS.every(role => approvedRoles.includes(role));

        // 5. If all have approved, update the main profile and Clerk metadata
        if (allApproved) {
            const { data: finalUpdate, error: finalUpdateError } = await supabase
                .from('profiles')
                .update({ approval_status: 'approved' })
                .eq('id', profileId)
                .select('clerk_id')
                .single();

            if (finalUpdateError) throw finalUpdateError;

            // Final update to Clerk metadata
            await (await clerkClient()).users.updateUser(finalUpdate.clerk_id, {
                publicMetadata: { ...user?.publicMetadata, approvalStatus: 'approved' }
            });
        }
        
        revalidatePath('/dashboard');
        return { success: true, status: allApproved ? 'approved' : 'pending' };

    } catch (error) {
        console.error("Error updating approval status:", error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}