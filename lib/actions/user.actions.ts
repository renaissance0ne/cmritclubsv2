"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreateUserParams {
  clerkId: string;
  fullName: string;
  phoneNumber: string;
  rollNumber: string;
  department: string;
  yearOfStudy: number;
  expectedGraduation: Date;
  clubName: string;
  facultyInCharge: string;
  proofLetterUrl: string;
}

export async function createUser(userData: CreateUserParams) {
  try {
    const clerk = await clerkClient();
    const supabase = await createClient();
    // 1. Get user details from Clerk to verify their email
    const user = await clerk.users.getUser(userData.clerkId);
    const email = user.emailAddresses.find((e: { id: string; }) => e.id === user.primaryEmailAddressId)?.emailAddress;

    // 2. BACKEND VALIDATION: Check if the email domain is correct
    if (!email || !email.endsWith('@cmrithyderabad.edu.in')) {
        // If the email is invalid, delete the user from Clerk to prevent them from trying again.
        await clerk.users.deleteUser(userData.clerkId);
        throw new Error('Invalid email domain. Only @cmrithyderabad.edu.in emails are allowed.');
    }

    // 3. Save user data to your Supabase `profiles` table
    const { data: profileData, error: supabaseError } = await supabase
      .from("profiles")
      .insert([{
          clerk_id: userData.clerkId,
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          roll_number: userData.rollNumber,
          department: userData.department,
          year_of_study: userData.yearOfStudy,
          expected_graduation: userData.expectedGraduation.toISOString(),
          club_name: userData.clubName,
          faculty_in_charge: userData.facultyInCharge,
          proof_letter_url: userData.proofLetterUrl,
          approval_status: 'pending',
      }])
      .select()
      .single();

    if (supabaseError) throw new Error(`Supabase error: ${supabaseError.message}`);

    // 4. Update user's public metadata in Clerk
    await clerk.users.updateUser(userData.clerkId, {
      publicMetadata: {
        role: 'student',
        onboardingComplete: true,
        approvalStatus: 'pending',
        profileId: profileData.id 
      },
    });

    revalidatePath('/onboarding');
    return { success: true, data: profileData };

  } catch (error: unknown) {
    console.error("Error creating user:", error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function hasUserProfile(clerkId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error checking user profile:', error.message);
      return false;
    }

    return !!data;
  } catch (error: unknown) {
    console.error('Error in hasUserProfile:', error);
    return false;
  }
}

export async function getUserProfile(clerkId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      // It's okay if no profile is found, just return null
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      throw new Error(`Supabase error: ${error.message}`);
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
