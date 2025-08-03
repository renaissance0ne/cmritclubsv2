"use server";

import { createClient } from "@/lib/supabase/server";

export interface OfficialInfo {
  isOfficial: boolean;
  role?: string;
  displayName?: string;
  college?: string;
}

// Middleware-safe function to check if a user is an official and get their role
export async function getUserOfficialInfo(clerkId: string): Promise<OfficialInfo> {
  try {
    const supabase = await createClient();
    
    const { data: official, error } = await supabase
      .from('officials')
      .select('official_role, display_name, college')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !official) {
      return { isOfficial: false };
    }
    
    return {
      isOfficial: true,
      role: official.official_role,
      displayName: official.display_name,
      college: official.college
    };
  } catch (error) {
    console.error("Error getting user official info:", error);
    return { isOfficial: false };
  }
}

// Backward compatibility function
export async function isUserOfficial(clerkId: string): Promise<boolean> {
  const info = await getUserOfficialInfo(clerkId);
  return info.isOfficial;
}
