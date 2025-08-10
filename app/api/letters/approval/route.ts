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
      letterId, 
      officialRole, 
      action, 
      approvedMembers = [], // For HODs: list of member IDs they're approving
      comment 
    } = await request.json();

    if (!letterId || !officialRole || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the official exists and has permission
    const { data: official, error: officialError } = await supabase
      .from('officials')
      .select('*')
      .eq('clerk_id', userId)
      .eq('official_role', officialRole)
      .single();

    if (officialError || !official) {
      return NextResponse.json(
        { error: 'Official not found or unauthorized' },
        { status: 403 }
      );
    }

    // Get the letter
    const { data: letter, error: letterError } = await supabase
      .from('letters')
      .select('*')
      .eq('id', letterId)
      .single();

    if (letterError || !letter) {
      return NextResponse.json(
        { error: 'Letter not found' },
        { status: 404 }
      );
    }

    // Parse recipients (handle both string and array formats)
    let recipients = [];
    if (typeof letter.recipients === 'string') {
      try {
        recipients = JSON.parse(letter.recipients);
      } catch (e) {
        console.error('Failed to parse recipients:', letter.recipients);
        return NextResponse.json(
          { error: 'Invalid recipients format' },
          { status: 500 }
        );
      }
    } else if (Array.isArray(letter.recipients)) {
      recipients = letter.recipients;
    }

    // Check if this official is supposed to review this letter
    if (!recipients.includes(officialRole)) {
      return NextResponse.json(
        { error: 'You are not authorized to review this letter' },
        { status: 403 }
      );
    }

    // Parse current approval_status
    let currentApprovalStatus = letter.approval_status || { overall_status: 'pending' };
    
    // Update the approval status for this official
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updatedApprovalStatus = {
      ...currentApprovalStatus,
      [officialRole]: {
        status: newStatus,
        comments: comment || null,
        updated_at: new Date().toISOString(),
        official_id: userId,
        approved_members: action === 'approve' ? approvedMembers : []
      }
    };

    // Check if all officials have approved the letter
    const allApproved = recipients.every((recipient: string) => {
      const status = updatedApprovalStatus[recipient];
      return status && status.status === 'approved';
    });

    // Check if any official has rejected the letter
    const anyRejected = recipients.some((recipient: string) => {
      const status = updatedApprovalStatus[recipient];
      return status && status.status === 'rejected';
    });

    // Update overall status
    if (allApproved) {
      updatedApprovalStatus.overall_status = 'approved';
    } else if (anyRejected) {
      updatedApprovalStatus.overall_status = 'rejected';
    } else {
      updatedApprovalStatus.overall_status = 'pending';
    }

    // Update the letter in the database
    const { data: updatedLetter, error: updateError } = await supabase
      .from('letters')
      .update({
        approval_status: updatedApprovalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', letterId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating letter approval status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update approval status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      letter: updatedLetter,
      message: `Letter ${newStatus} successfully`
    });

  } catch (error) {
    console.error('Error in POST /api/letters/approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
