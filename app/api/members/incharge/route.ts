import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { club_name, college, incharge_name, incharge_phone } = await request.json();

    if (!club_name || !college || !incharge_name) {
      return NextResponse.json(
        { error: 'Club name, college, and in-charge name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, get the user's profile to determine their club
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('club_name, full_name')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.log('User profile not found:', profileError);
      return NextResponse.json(
        { error: 'User profile not found. Please complete onboarding first.' },
        { status: 403 }
      );
    }

    // Verify the user can only manage their own club's data
    if (userProfile.club_name !== club_name) {
      console.log('Authorization failed: User club mismatch', {
        userClub: userProfile.club_name,
        requestedClub: club_name
      });
      return NextResponse.json(
        { error: 'Unauthorized: You can only manage your own club data' },
        { status: 403 }
      );
    }

    console.log('Authorization successful for user:', userProfile.full_name, 'managing club:', club_name);

    // Authorization is now handled via user profile verification above

    // Check if there's already an in-charge for this club
    const { data: existingInCharge, error: existingError } = await supabase
      .from('club_members')
      .select('*')
      .eq('club_name', club_name)
      .eq('college', college)
      .eq('role', 'incharge')
      .eq('is_active', true)
      .single();

    if (existingInCharge) {
      // Update existing in-charge
      const { data: updatedInCharge, error: updateError } = await supabase
        .from('club_members')
        .update({
          name: incharge_name.trim(),
          incharge_name: incharge_name.trim(),
          incharge_phone: incharge_phone?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInCharge.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating in-charge:', updateError);
        return NextResponse.json(
          { error: 'Failed to update in-charge' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedInCharge);
    } else {
      // Create new in-charge
      const { data: newInCharge, error: insertError } = await supabase
        .from('club_members')
        .insert({
          club_name,
          college,
          name: incharge_name.trim(),
          role: 'incharge',
          incharge_name: incharge_name.trim(),
          incharge_phone: incharge_phone?.trim() || null,
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating in-charge:', insertError);
        return NextResponse.json(
          { error: 'Failed to create in-charge' },
          { status: 500 }
        );
      }

      return NextResponse.json(newInCharge, { status: 201 });
    }

  } catch (error) {
    console.error('Error in POST /api/members/incharge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
