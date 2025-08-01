"use server";

import { clerkClient, auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REQUIRED_APPROVALS = ['hod', 'dean', 'tpo', 'director'];

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