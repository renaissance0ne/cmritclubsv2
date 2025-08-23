import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Mentor } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Verify user is admin
    const { data: currentUser } = await supabase
      .from('officials')
      .select('official_role')
      .eq('clerk_id', userId)
      .single();

    console.log('Mentors API - Current user check:', currentUser);

    if (!currentUser || currentUser.official_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Use service client to bypass RLS for admin operations
    const serviceSupabase = createServiceClient();
    const { data: mentors, error } = await serviceSupabase
      .from('mentors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentors:', error);
      return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
    }

    console.log('Mentors API - Found mentors:', mentors?.length || 0);
    console.log('Mentors API - Data:', JSON.stringify(mentors, null, 2));

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error('Error in GET /api/mentors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Verify user is admin
    const { data: currentUser } = await supabase
      .from('officials')
      .select('official_role')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser || currentUser.official_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { display_name, email, dept, role, college, year } = body;

    // Validate required fields
    if (!display_name || !email || !dept || !role || !college) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingMentor } = await supabase
      .from('mentors')
      .select('id')
      .eq('email', email)
      .single();

    if (existingMentor) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    let clerkUserId = null;
    
    try {
      const clerk = await clerkClient();
      
      // Skip user creation and just send invitation
      // Clerk will create the user when they accept the invitation
      console.log('Sending invitation directly without user creation');

      // Try to send invitation, but don't fail if duplicate
      try {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: {
            role: 'mentor',
            onboardingComplete: true,
            approvalStatus: 'approved'
          }
        });
        console.log('Invitation sent successfully');
      } catch (inviteError: any) {
        console.log('Invitation error (continuing anyway):', inviteError.errors);
        // Continue with database insert even if invitation fails
      }

      // Store in Supabase using service client to bypass RLS
      // Note: clerk_id will be null initially and updated when user accepts invitation
      const serviceSupabase = createServiceClient();
      const { data: newMentor, error: insertError } = await serviceSupabase
        .from('mentors')
        .insert({
          clerk_id: null, // Will be updated via webhook when user accepts invitation
          display_name,
          email,
          dept,
          role,
          college,
          year,
          status: 'pending',
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        // If Supabase insert fails, clean up Clerk user if it was created
        if (clerkUserId) {
          await clerk.users.deleteUser(clerkUserId);
        }
        throw insertError;
      }

      return NextResponse.json({ 
        message: 'Mentor created and invitation sent successfully',
        mentor: newMentor 
      });

    } catch (clerkError: any) {
      console.error('Clerk API error:', clerkError);
      console.error('Clerk error details:', clerkError.errors);
      return NextResponse.json({ 
        error: 'Failed to create user account or send invitation',
        details: clerkError.errors || clerkError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in POST /api/mentors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Verify user is admin
    const { data: currentUser } = await supabase
      .from('officials')
      .select('official_role')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser || currentUser.official_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('id');

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    // Get mentor details before deletion
    const { data: mentor } = await supabase
      .from('mentors')
      .select('clerk_id')
      .eq('id', mentorId)
      .single();

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Delete from Supabase first using service client
    const serviceSupabase = createServiceClient();
    const { error: deleteError } = await serviceSupabase
      .from('mentors')
      .delete()
      .eq('id', mentorId);

    if (deleteError) {
      throw deleteError;
    }

    // Delete from Clerk if clerk_id exists
    if (mentor.clerk_id) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(mentor.clerk_id);
      } catch (clerkError) {
        console.error('Error deleting from Clerk:', clerkError);
        // Continue even if Clerk deletion fails
      }
    }

    return NextResponse.json({ message: 'Mentor deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/mentors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
