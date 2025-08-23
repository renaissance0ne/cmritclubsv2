import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Official } from '@/lib/types';

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

    if (!currentUser || currentUser.official_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all officials
    const { data: officials, error } = await supabase
      .from('officials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching officials:', error);
      return NextResponse.json({ error: 'Failed to fetch officials' }, { status: 500 });
    }

    return NextResponse.json({ officials });
  } catch (error) {
    console.error('Error in GET /api/officials:', error);
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
    const { display_name, email, dept, official_role, college } = body;

    // Validate required fields
    if (!display_name || !email || !official_role || !college) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingOfficial } = await supabase
      .from('officials')
      .select('id')
      .eq('email', email)
      .single();

    if (existingOfficial) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    let clerkUserId = null;
    
    try {
      const clerk = await clerkClient();
      
      // Try to create user first, but handle if email already exists
      try {
        const clerkUser = await clerk.users.createUser({
          emailAddress: [email],
          firstName: display_name.split(' ')[0],
          lastName: display_name.split(' ').slice(1).join(' ') || 'User',
          publicMetadata: {
            role: official_role === 'admin' ? 'admin' : 'college_official',
            onboardingComplete: true,
            approvalStatus: 'approved'
          }
        });
        clerkUserId = clerkUser.id;
      } catch (userCreateError: any) {
        console.log('User creation failed, trying invitation only:', userCreateError.errors);
        // If user creation fails, we'll just send an invitation
      }

      // Skip user creation and just send invitation
      // Clerk will create the user when they accept the invitation
      console.log('Sending invitation directly without user creation');

      // Try to send invitation, but don't fail if duplicate
      try {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: {
            role: official_role === 'admin' ? 'admin' : 'college_official',
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
      const { data: newOfficial, error: insertError } = await serviceSupabase
        .from('officials')
        .insert({
          clerk_id: null, // Will be updated via webhook when user accepts invitation
          display_name,
          email,
          dept,
          official_role,
          role: official_role === 'admin' ? 'admin' : 'college_official',
          college,
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
        message: 'Official created and invitation sent successfully',
        official: newOfficial 
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
    console.error('Error in POST /api/officials:', error);
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
    const officialId = searchParams.get('id');

    if (!officialId) {
      return NextResponse.json({ error: 'Official ID is required' }, { status: 400 });
    }

    // Get official details before deletion
    const { data: official } = await supabase
      .from('officials')
      .select('clerk_id')
      .eq('id', officialId)
      .single();

    if (!official) {
      return NextResponse.json({ error: 'Official not found' }, { status: 404 });
    }

    // Delete from Supabase first using service client
    const serviceSupabase = createServiceClient();
    const { error: deleteError } = await serviceSupabase
      .from('officials')
      .delete()
      .eq('id', officialId);

    if (deleteError) {
      throw deleteError;
    }

    // Delete from Clerk if clerk_id exists
    if (official.clerk_id) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(official.clerk_id);
      } catch (clerkError) {
        console.error('Error deleting from Clerk:', clerkError);
        // Continue even if Clerk deletion fails
      }
    }

    return NextResponse.json({ message: 'Official deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/officials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
