import { auth, clerkClient as createClerkClient } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sessionClaims, userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userData = await req.json();
    const supabase = await createSupabaseClient();
    const clerkClient = await createClerkClient();

    // 1. Get user details from Clerk to verify their email
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses.find((e: { id: string }) => e.id === user.primaryEmailAddressId)?.emailAddress;

    // 2. BACKEND VALIDATION: Check if the email domain is correct
    if (!email || !email.endsWith('@cmrithyderabad.edu.in')) {
      await clerkClient.users.deleteUser(userId);
      return new NextResponse('Invalid email domain.', { status: 400 });
    }

    // 3. Save user data to Supabase
    const { data: profileData, error: supabaseError } = await supabase
      .from('profiles')
      .insert([{
        clerk_id: userId,
        ...userData,
        approval_status: 'pending',
      }])
      .select()
      .single();

    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }

    // 4. Update user's public metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        approvalStatus: 'pending',
        profileId: profileData.id,
      },
    });

    // 5. Return a success response
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in /api/onboard:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}
