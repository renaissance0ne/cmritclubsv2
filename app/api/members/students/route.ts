import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { VALID_DEPARTMENTS, STUDENT_YEARS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      college,
      name, 
      roll_number, 
      year, 
      department, 
      section,
      role,
      email, 
      phone 
    } = await request.json();

    // Validate required fields
    if (!college || !name || !roll_number || !year || !department || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate year and department
    if (!STUDENT_YEARS.includes(year) || !VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json(
        { error: 'Invalid year or department' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user's profile to determine their club name (same pattern as in-charge API)
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

    if (!userProfile.club_name) {
      return NextResponse.json(
        { error: 'User has no club assigned. Please complete onboarding first.' },
        { status: 403 }
      );
    }

    // Use the user's profile club name for security
    const club_name = userProfile.club_name;

    console.log('Authorization successful for user:', userProfile.full_name, 'managing club:', club_name);

    // Check if roll number already exists in this club
    const { data: existingMember, error: checkError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_name', club_name)
      .eq('college', college)
      .eq('roll_number', roll_number.toLowerCase())
      .eq('is_active', true)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'A member with this roll number already exists in the club' },
        { status: 409 }
      );
    }

    // Create the new member
    const { data: newMember, error: insertError } = await supabase
      .from('club_members')
      .insert({
        club_name,
        college,
        name: name.trim(),
        roll_number: roll_number.toLowerCase(),
        year,
        department,
        section: section?.trim() || null,
        role: role.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        is_active: true,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating member:', insertError);
      return NextResponse.json(
        { error: 'Failed to create member' },
        { status: 500 }
      );
    }

    return NextResponse.json(newMember, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/members/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      member_id,
      college,
      name, 
      roll_number, 
      year, 
      department, 
      section,
      role,
      email, 
      phone 
    } = await request.json();

    // Validate required fields
    if (!member_id || !college || !name || !roll_number || !year || !department || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate year and department
    if (!STUDENT_YEARS.includes(year) || !VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json(
        { error: 'Invalid year or department' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user's profile to determine their club name
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('club_name, full_name')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !userProfile || !userProfile.club_name) {
      return NextResponse.json(
        { error: 'User profile not found or no club assigned' },
        { status: 403 }
      );
    }

    const club_name = userProfile.club_name;

    // Check if the member exists and belongs to this club
    const { data: existingMember, error: memberError } = await supabase
      .from('club_members')
      .select('*')
      .eq('id', member_id)
      .eq('club_name', club_name)
      .eq('college', college)
      .eq('is_active', true)
      .single();

    if (memberError || !existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if roll number already exists for another member in this club
    const { data: duplicateMember, error: duplicateError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_name', club_name)
      .eq('college', college)
      .eq('roll_number', roll_number.toLowerCase())
      .eq('is_active', true)
      .neq('id', member_id)
      .single();

    if (duplicateMember) {
      return NextResponse.json(
        { error: 'A member with this roll number already exists in the club' },
        { status: 409 }
      );
    }

    // Update the member
    const { data: updatedMember, error: updateError } = await supabase
      .from('club_members')
      .update({
        name: name.trim(),
        roll_number: roll_number.toLowerCase(),
        year,
        department,
        section: section?.trim() || null,
        role: role.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', member_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMember);

  } catch (error) {
    console.error('Error in PUT /api/members/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { member_id, college } = await request.json();

    if (!member_id || !college) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user's profile to determine their club name
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('club_name, full_name')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !userProfile || !userProfile.club_name) {
      return NextResponse.json(
        { error: 'User profile not found or no club assigned' },
        { status: 403 }
      );
    }

    const club_name = userProfile.club_name;

    console.log('DELETE member request:', {
      member_id,
      club_name,
      college,
      user_profile: userProfile.full_name
    });

    // First, check if the member exists with the given conditions
    const { data: existingMember, error: checkError } = await supabase
      .from('club_members')
      .select('*')
      .eq('id', member_id)
      .eq('club_name', club_name)
      .eq('college', college)
      .single();

    console.log('Member lookup result:', { existingMember, checkError });

    if (checkError || !existingMember) {
      console.error('Member not found for deletion:', { member_id, club_name, college });
      return NextResponse.json(
        { error: 'Member not found or you do not have permission to delete this member' },
        { status: 404 }
      );
    }

    // Prevent deletion of critical roles
    if (existingMember.role === 'lead' || existingMember.role === 'club_lead') {
      return NextResponse.json(
        { error: 'Cannot delete club lead. Please transfer leadership first.' },
        { status: 403 }
      );
    }

    if (existingMember.role === 'incharge') {
      return NextResponse.json(
        { error: 'Cannot delete club in-charge. Please assign a new in-charge first.' },
        { status: 403 }
      );
    }

    // Hard delete the member (completely remove from database)
    const { data: deleteResult, error: deleteError } = await supabase
      .from('club_members')
      .delete()
      .eq('id', member_id)
      .eq('club_name', club_name)
      .eq('college', college)
      .select();

    console.log('Delete result:', { deleteResult, deleteError });

    if (deleteError) {
      console.error('Error deleting member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Member removed successfully',
      deletedMember: {
        id: existingMember.id,
        name: existingMember.name,
        roll_number: existingMember.roll_number
      }
    });

  } catch (error) {
    console.error('Error in DELETE /api/members/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
