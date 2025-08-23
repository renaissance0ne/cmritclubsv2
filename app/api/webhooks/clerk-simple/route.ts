import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  console.log('=== SIMPLE CLERK WEBHOOK RECEIVED ===');
  
  try {
    const body = await req.json();
    const { type, data } = body;
    
    console.log('Webhook type:', type);
    console.log('Webhook data:', JSON.stringify(data, null, 2));

    if (type === 'user.created') {
      await handleUserCreated(data);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  const { id: clerkId, email_addresses, primary_email_address_id } = userData;
  
  console.log('Processing user.created webhook:', {
    clerkId,
    email_addresses,
    primary_email_address_id
  });

  // Try to get primary email
  let primaryEmail = null;
  if (email_addresses && email_addresses.length > 0) {
    if (primary_email_address_id) {
      primaryEmail = email_addresses.find((email: any) => email.id === primary_email_address_id)?.email_address;
    }
    // Fallback to first email if primary not found
    if (!primaryEmail) {
      primaryEmail = email_addresses[0]?.email_address;
    }
  }

  if (!primaryEmail) {
    console.error('No email found for user:', clerkId, email_addresses);
    return;
  }

  console.log('Attempting to update database for email:', primaryEmail, 'with clerk_id:', clerkId);

  const serviceSupabase = createServiceClient();

  // Check if we have any records with this email
  const { data: existingOfficial } = await serviceSupabase
    .from('officials')
    .select('*')
    .eq('email', primaryEmail)
    .single();

  const { data: existingMentor } = await serviceSupabase
    .from('mentors')
    .select('*')
    .eq('email', primaryEmail)
    .single();

  console.log('Found existing records:', {
    official: existingOfficial,
    mentor: existingMentor
  });

  // Update mentors table
  const { data: updatedMentor, error: mentorError } = await serviceSupabase
    .from('mentors')
    .update({ 
      clerk_id: clerkId,
      status: 'approved',
      invitation_accepted_at: new Date().toISOString()
    })
    .eq('email', primaryEmail)
    .select();

  if (mentorError) {
    console.error('Error updating mentor:', mentorError);
  } else {
    console.log('Updated mentor records:', updatedMentor);
  }

  // Update officials table
  const { data: updatedOfficial, error: officialError } = await serviceSupabase
    .from('officials')
    .update({ 
      clerk_id: clerkId,
      status: 'approved',
      invitation_accepted_at: new Date().toISOString()
    })
    .eq('email', primaryEmail)
    .select();

  if (officialError) {
    console.error('Error updating official:', officialError);
  } else {
    console.log('Updated official records:', updatedOfficial);
  }
}
