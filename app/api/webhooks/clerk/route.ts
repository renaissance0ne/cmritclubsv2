import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Handle the webhook
  const { type, data } = evt;
  console.log('Clerk webhook received:', type);

  if (type === 'user.created') {
    await handleUserCreated(data);
  } else if (type === 'invitationAccepted') {
    await handleInvitationAccepted(data);
  }

  return NextResponse.json({ received: true });
}

async function handleUserCreated(userData: any) {
  const { id: clerkId, email_addresses, public_metadata } = userData;
  const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id)?.email_address;

  if (!primaryEmail) {
    console.log('No primary email found for user:', clerkId);
    return;
  }

  console.log('Updating clerk_id for user:', primaryEmail, clerkId);

  const serviceSupabase = createServiceClient();

  // Update officials table
  const { error: officialError } = await serviceSupabase
    .from('officials')
    .update({ 
      clerk_id: clerkId,
      status: 'approved',
      invitation_accepted_at: new Date().toISOString()
    })
    .eq('email', primaryEmail)
    .is('clerk_id', null);

  if (officialError) {
    console.error('Error updating official:', officialError);
  } else {
    console.log('Updated official with clerk_id:', clerkId);
  }

  // Update mentors table
  const { error: mentorError } = await serviceSupabase
    .from('mentors')
    .update({ 
      clerk_id: clerkId,
      status: 'approved',
      invitation_accepted_at: new Date().toISOString()
    })
    .eq('email', primaryEmail)
    .is('clerk_id', null);

  if (mentorError) {
    console.error('Error updating mentor:', mentorError);
  } else {
    console.log('Updated mentor with clerk_id:', clerkId);
  }
}

async function handleInvitationAccepted(invitationData: any) {
  // This is called when an invitation is accepted
  // The user.created event will handle the actual user linking
  console.log('Invitation accepted:', invitationData);
}
