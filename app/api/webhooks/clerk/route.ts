import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  console.log('=== CLERK WEBHOOK RECEIVED ===');
  
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  console.log('Webhook headers:', { svix_id, svix_timestamp, svix_signature });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  console.log('Webhook secret exists:', !!webhookSecret);
  
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not found in environment');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
    console.log('Webhook verification successful');
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Handle the webhook
  const { type, data } = evt;
  console.log('Clerk webhook received:', type, JSON.stringify(data, null, 2));

  if (type === 'user.created') {
    await handleUserCreated(data);
  } else if (type === 'invitation.accepted') {
    await handleInvitationAccepted(data);
  } else {
    console.log('Unhandled webhook type:', type);
  }

  return NextResponse.json({ received: true });
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
}

async function handleInvitationAccepted(invitationData: any) {
  // This is called when an invitation is accepted
  // The user.created event will handle the actual user linking
  console.log('Invitation accepted:', invitationData);
}
