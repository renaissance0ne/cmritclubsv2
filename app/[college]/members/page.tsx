import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { validateClubRoute } from '@/lib/utils/route-validation';
import { createClient } from '@/lib/supabase/server';
import { MembersManagement } from '@/components/members/members-management';

interface MembersPageProps {
  params: Promise<{
    college: string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { college } = await params;
  
  // Validate the college parameter
  const validation = validateClubRoute(college);
  if (!validation.isValid) {
    redirect('/404');
  }

  const validCollege = validation.college!;
  const supabase = await createClient();

  // Get user's profile to determine their club name
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('club_name')
    .eq('clerk_id', userId)
    .single();

  let clubName = '';
  if (profileError || !userProfile || !userProfile.club_name) {
    // Fallback: try to get club name from any existing member
    const { data: anyMember, error: memberError } = await supabase
      .from('club_members')
      .select('club_name')
      .eq('college', validCollege)
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (anyMember && anyMember.club_name) {
      clubName = anyMember.club_name;
    } else {
      // Final fallback: use default club name
      clubName = `${validCollege.toUpperCase()} Club`;
    }
  } else {
    clubName = userProfile.club_name;
  }

  console.log('Members page: Using club name:', clubName);

  // Get all club members (including in-charge and students)
  const { data: allMembers, error: membersError } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_name', clubName)
    .eq('college', validCollege)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (membersError) {
    console.error('Error fetching members:', membersError);
  }

  // Get custom roles for this club
  const { data: rolesData, error: rolesError } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_name', clubName)
    .eq('college', validCollege)
    .eq('is_active', true);

  const customRoles = rolesData ? [...new Set(rolesData.map(r => r.role).filter(role => role && role !== 'incharge' && role !== 'club_lead'))] : [];

  if (rolesError) {
    console.error('Error fetching custom roles:', rolesError);
  }

  // Separate members by role
  const inCharge = allMembers?.find(member => member.role === 'incharge') || null;
  const students = allMembers?.filter(member => member.role !== 'incharge' && member.role !== 'club_lead') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Club Members</h1>
          <p className="mt-2 text-gray-600">
            Manage your club's faculty in-charge and student members
          </p>
        </div>

        <MembersManagement
          clubName={clubName}
          college={validCollege}
          currentInCharge={inCharge}
          members={students}
          customRoles={customRoles || []}
        />
      </div>
    </div>
  );
}
