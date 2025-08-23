import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  console.log('=== TEST WEBHOOK ENDPOINT CALLED ===');
  
  try {
    const body = await req.json();
    const { email, clerk_id } = body;

    console.log('Received data:', { email, clerk_id });

    if (!email || !clerk_id) {
      return NextResponse.json({ error: 'Missing email or clerk_id' }, { status: 400 });
    }

      console.log('Testing webhook update for:', email, clerk_id);

    const serviceSupabase = createServiceClient();

    // Check existing records first
    const { data: existingMentor } = await serviceSupabase
      .from('mentors')
      .select('*')
      .eq('email', email)
      .single();

    const { data: existingOfficial } = await serviceSupabase
      .from('officials')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Found existing records:', {
      mentor: existingMentor,
      official: existingOfficial
    });

    // Update mentors table
    const { data: updatedMentor, error: mentorError } = await serviceSupabase
      .from('mentors')
      .update({ 
        clerk_id: clerk_id,
        status: 'approved',
        invitation_accepted_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    console.log('Mentor update result:', { data: updatedMentor, error: mentorError });

    // Update officials table
    const { data: updatedOfficial, error: officialError } = await serviceSupabase
      .from('officials')
      .update({ 
        clerk_id: clerk_id,
        status: 'approved',
        invitation_accepted_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    console.log('Official update result:', { data: updatedOfficial, error: officialError });

    return NextResponse.json({
      success: true,
      mentorUpdate: { data: updatedMentor, error: mentorError },
      officialUpdate: { data: updatedOfficial, error: officialError }
    });
    
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook test endpoint is working' });
}
