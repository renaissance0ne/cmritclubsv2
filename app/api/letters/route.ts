import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      collection_id,
      recipients,
      subject,
      body,
      club_members_by_dept,
      closing
    } = await request.json();

    if (!collection_id || !recipients || !subject || !body || !club_members_by_dept) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the club leader's profile to verify they're approved
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, approval_status')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const requiredApprovals = ['tpo', 'dean', 'director'];
    const profileApprovalStatus = profile.approval_status as any;
    const isApproved = requiredApprovals.every(
      (role) => profileApprovalStatus?.[role]?.status === 'approved'
    );

    if (!isApproved) {
      return NextResponse.json(
        { error: 'Your profile must be approved by the TPO, Dean, and Director before creating letters.' },
        { status: 403 }
      );
    }

    // Initialize approval_status for all recipients
    const initialApprovalStatus = recipients.reduce((acc: any, recipient: string) => {
      acc[recipient] = { status: 'pending', updated_at: new Date().toISOString(), comments: null, approved_members: [] };
      return acc;
    }, {});

    // Combine body and closing for the final letter content
    const fullBody = `${body.trim()}\n\n${closing || ''}`.trim();

    // Upsert the letter
    const { data: letter, error } = await supabase
      .from('letters')
      .upsert({
        collection_id,
        recipients,
        subject: subject.trim(),
        body: fullBody,
        club_members_by_dept,
        approval_status: initialApprovalStatus,
      }, { onConflict: 'collection_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting letter:', error);
      return NextResponse.json(
        { error: 'Failed to create or update letter', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(letter);
  } catch (error: any) {
    console.error('Error in POST /api/letters:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
