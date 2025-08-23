import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ club_id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college');
    const officialRole = searchParams.get('officialRole');

    if (!college || !officialRole) {
      return NextResponse.json(
        { error: 'College and official role are required' },
        { status: 400 }
      );
    }

    const clubIdentifier = decodeURIComponent(resolvedParams.club_id);
    
    // Check if the identifier is a UUID (club_id) or a club name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubIdentifier);
    
    let clubData = null;
    let clubMembers = null;
    
    if (isUUID) {
      // If it's a UUID, get club info from profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clubIdentifier)
        .eq('college', college)
        .single();
        
      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Club not found' },
          { status: 404 }
        );
      }
      
      clubData = profile;
      
      // Get club members using club_name from profile
      const { data: members, error: membersError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_name', profile.club_name)
        .eq('college', college)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (membersError) {
        console.error('Error fetching club members:', membersError);
        return NextResponse.json(
          { error: 'Failed to fetch club members' },
          { status: 500 }
        );
      }
      
      clubMembers = members;
    } else {
      // If it's a club name, use the original logic
      const { data: members, error: membersError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_name', clubIdentifier)
        .eq('college', college)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (membersError) {
        console.error('Error fetching club members:', membersError);
        return NextResponse.json(
          { error: 'Failed to fetch club members' },
          { status: 500 }
        );
      }
      
      clubMembers = members;
      
      // Get club profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('club_name', clubIdentifier)
        .eq('college', college)
        .single();
        
      clubData = profile;
    }


    // Get collections for this club using the club_id from profile
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .eq('club_id', clubData?.id)
      .eq('college', college)
      .order('created_at', { ascending: false });

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    // Fetch letters for each collection separately and combine
    const collectionsWithLetters = await Promise.all(
      (collections || []).map(async (collection) => {
        const { data: letters, error: lettersError } = await supabase
          .from('letters')
          .select(`
            id,
            subject,
            created_at,
            approval_status
          `)
          .eq('collection_id', collection.id);

        if (lettersError) {
          console.error('Error fetching letters for collection', collection.id, lettersError);
          return { ...collection, letters: [] };
        }

        return { ...collection, letters: letters || [] };
      })
    );

    const clubCollections = collectionsWithLetters;

    // Group members by role
    const membersByRole = clubMembers?.reduce((acc: any, member) => {
      const role = member.role || 'member';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(member);
      return acc;
    }, {});

    // Get club leadership
    const clubLeads = membersByRole?.lead || membersByRole?.leader || [];
    const clubIncharge = membersByRole?.incharge || [];

    const clubDetails = {
      club_name: clubData?.club_name || clubIdentifier,
      college: college,
      total_members: clubMembers?.length || 0,
      members_by_role: membersByRole,
      club_leads: clubLeads,
      club_incharge: clubIncharge,
      collections: clubCollections.map(collection => ({
        ...collection,
        letter_count: collection.letters?.length || 0
      })),
      department: clubData?.department || clubMembers?.[0]?.department || null,
      created_at: clubData?.created_at || clubMembers?.[0]?.created_at || null,
      faculty_in_charge: clubData?.faculty_in_charge || null,
      lead_info: clubData ? {
        name: clubData.full_name,
        department: clubData.department,
        year: clubData.year_of_study,
        phone: clubData.phone_number,
        approval_status: clubData.approval_status
      } : null
    };

    return NextResponse.json({ club: clubDetails });

  } catch (error) {
    console.error('Error in club details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
