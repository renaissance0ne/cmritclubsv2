import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, college } = await request.json();

    if (!name || !college) {
      return NextResponse.json(
        { error: 'Name and college are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the club leader's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .eq('college', college)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if the club leader is approved
    const approvalStatus = profile.approval_status as any;
    
    // Check if all required approvals are approved
    const requiredApprovals = ['tpo', 'dean', 'hsHod', 'csdHod', 'cseHod', 'csmHod', 'eceHod', 'director'];
    const allApproved = requiredApprovals.every(role => 
      approvalStatus?.[role]?.status === 'approved'
    );
    
    if (!allApproved) {
      return NextResponse.json(
        { error: 'Only approved club leaders can create collections' },
        { status: 403 }
      );
    }

    // Check if collection with same name already exists for this club
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('club_id', profile.id)
      .eq('name', name)
      .single();

    if (existingCollection) {
      return NextResponse.json(
        { error: 'A collection with this name already exists' },
        { status: 409 }
      );
    }

    // Create the collection
    const { data: collection, error: createError } = await supabase
      .from('collections')
      .insert({
        club_id: profile.id,
        name: name.trim(),
        college,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating collection:', createError);
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      );
    }

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/collections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
