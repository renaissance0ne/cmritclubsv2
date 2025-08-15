import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { club_id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const sortBy = searchParams.get('sortBy') || 'recent';

    if (!college) {
      return NextResponse.json(
        { error: 'College is required' },
        { status: 400 }
      );
    }

    const clubIdentifier = decodeURIComponent(params.club_id);
    
    // Check if the identifier is a UUID (club_id) or a club name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubIdentifier);
    
    let clubId = clubIdentifier;
    let clubName = clubIdentifier;
    
    console.log('Club identifier:', clubIdentifier, 'isUUID:', isUUID);
    
    if (isUUID) {
      // If it's a UUID, get club info from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, club_name')
        .eq('id', clubIdentifier)
        .eq('college', college)
        .single();
        
      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Club not found' },
          { status: 404 }
        );
      }
      
      clubId = profile.id;
      clubName = profile.club_name;
      console.log('Found profile for UUID:', { clubId, clubName });
    } else {
      // If it's a club name, get the club_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, club_name')
        .eq('club_name', clubIdentifier)
        .eq('college', college)
        .single();
        
      if (profile) {
        clubId = profile.id;
        clubName = profile.club_name;
        console.log('Found profile for club name:', { clubId, clubName });
      }
    }

    console.log('Final clubId for query:', clubId);

    // Get collections first
    let collectionsQuery = supabase
      .from('collections')
      .select('*')
      .eq('club_id', clubId)
      .eq('college', college);

    // Apply date filters if provided
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      collectionsQuery = collectionsQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      collectionsQuery = collectionsQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: collections, error: collectionsError } = await collectionsQuery;

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    console.log('Raw collections data:', JSON.stringify(collections, null, 2));

    // Now fetch letters for each collection
    const collectionsWithLetters = await Promise.all(
      (collections || []).map(async (collection) => {
        const { data: letters, error: lettersError } = await supabase
          .from('letters')
          .select(`
            id,
            subject,
            recipients,
            body,
            club_members_by_dept,
            approval_status,
            created_at
          `)
          .eq('collection_id', collection.id);

        if (lettersError) {
          console.error('Error fetching letters for collection', collection.id, lettersError);
          return { ...collection, letters: [] };
        }

        console.log(`Collection ${collection.name} has ${letters?.length || 0} letters`);
        return { ...collection, letters: letters || [] };
      })
    );

    const clubCollections = collectionsWithLetters;

    // Sort collections
    let sortedCollections = [...clubCollections];
    switch (sortBy) {
      case 'oldest':
        sortedCollections.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'year':
        sortedCollections.sort((a, b) => {
          const yearA = new Date(a.created_at).getFullYear();
          const yearB = new Date(b.created_at).getFullYear();
          return yearB - yearA;
        });
        break;
      case 'month':
        sortedCollections.sort((a, b) => {
          const monthA = new Date(a.created_at).getMonth();
          const monthB = new Date(b.created_at).getMonth();
          return monthB - monthA;
        });
        break;
      case 'recent':
      default:
        sortedCollections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // Enhance collections with additional metadata
    const enhancedCollections = sortedCollections.map(collection => ({
      ...collection,
      letter_count: collection.letters?.length || 0,
      latest_letter: collection.letters?.[0] || null,
      approval_status: collection.letters?.reduce((acc: any, letter: any) => {
        const status = letter.approval_status || {};
        Object.keys(status).forEach(key => {
          if (!acc[key]) acc[key] = { approved: 0, pending: 0, rejected: 0 };
          if (status[key] === 'approved') acc[key].approved++;
          else if (status[key] === 'rejected') acc[key].rejected++;
          else acc[key].pending++;
        });
        return acc;
      }, {})
    }));

    return NextResponse.json({ 
      collections: enhancedCollections,
      total_count: enhancedCollections.length,
      club_name: clubName
    });

  } catch (error) {
    console.error('Error in club collections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
