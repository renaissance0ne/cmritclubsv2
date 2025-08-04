import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get the club leader's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
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
        { error: 'Only approved club leaders can delete letters' },
        { status: 403 }
      );
    }

    // Verify the letter belongs to this club leader through the collection
    const { data: letter, error: letterError } = await supabase
      .from('letters')
      .select(`
        *,
        collections!inner(
          id,
          club_id
        )
      `)
      .eq('id', id)
      .eq('collections.club_id', profile.id)
      .single();

    if (letterError || !letter) {
      return NextResponse.json(
        { error: 'Letter not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the letter
    const { error: deleteError } = await supabase
      .from('letters')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting letter:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete letter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/letters/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
