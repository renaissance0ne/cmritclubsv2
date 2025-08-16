import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college');
    const officialRole = searchParams.get('officialRole');
    const department = searchParams.get('department');

    if (!college || !officialRole) {
      return NextResponse.json(
        { error: 'College and official role are required' },
        { status: 400 }
      );
    }

    // Step 1: Get all clubs from profiles table (primary source of club data)
    let profilesQuery = supabase
      .from('profiles')
      .select(`
        id,
        club_name,
        full_name,
        department,
        year_of_study,
        phone_number,
        faculty_in_charge,
        approval_status,
        created_at
      `)
      .eq('college', college)
      .not('club_name', 'is', null);

    // If HOD, filter by department
    if (officialRole.includes('_hod') && department) {
      profilesQuery = profilesQuery.eq('department', department.toUpperCase());
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch clubs' },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ clubs: [] });
    }

    // Step 2: Get detailed data for each club
    const clubsWithData = await Promise.all(profiles.map(async (profile) => {
      // Get member count from club_members table
      const { count: memberCount, error: countError } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_name', profile.club_name)
        .eq('college', college)
        .eq('is_active', true);

      // Get collections count
      const { count: collectionsCount, error: collectionsError } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', profile.id)
        .eq('college', college);

      // Get letters count - need to get collections first, then count letters
      const { data: collections, error: collectionsDataError } = await supabase
        .from('collections')
        .select('id')
        .eq('club_id', profile.id)
        .eq('college', college);

      let pendingLetters = 0;
      if (collections && collections.length > 0) {
        const collectionIds = collections.map(c => c.id);
        const { count: lettersCount, error: lettersError } = await supabase
          .from('letters')
          .select('*', { count: 'exact', head: true })
          .in('collection_id', collectionIds)
          .contains('approval_status', { overall_status: 'pending' });
        
        pendingLetters = lettersCount || 0;
      }

      // Parse approval status if it's a JSON string
      let approvalStatus = 'pending';
      if (profile.approval_status) {
        try {
          const parsed = typeof profile.approval_status === 'string' 
            ? JSON.parse(profile.approval_status) 
            : profile.approval_status;
          approvalStatus = parsed.overall_status || 'pending';
        } catch (e) {
          approvalStatus = 'pending';
        }
      }

      return {
        club_name: profile.club_name,
        college: college,
        department: profile.department || 'Unknown',
        incharge_name: profile.faculty_in_charge || 'Not specified',
        incharge_phone: profile.phone_number || 'Not provided',
        member_count: memberCount || 0,
        created_at: profile.created_at || new Date().toISOString(),
        
        // Lead information
        lead_info: {
          name: profile.full_name,
          department: profile.department,
          year: profile.year_of_study,
          phone: profile.phone_number,
          approval_status: approvalStatus
        },
        
        // Activity statistics
        activities: {
          total_collections: collectionsCount || 0,
          pending_approvals: pendingLetters
        },

        // Club ID for further operations
        club_id: profile.id
      };
    }));

    // Sort by creation date (newest first)
    const validClubs = clubsWithData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ 
      clubs: validClubs,
      summary: {
        total_clubs: validClubs.length,
        total_members: validClubs.reduce((sum, club) => sum + club.member_count, 0),
        active_clubs: validClubs.filter(club => club.lead_info?.approval_status === 'approved').length
      }
    });

  } catch (error) {
    console.error('Error in clubs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
