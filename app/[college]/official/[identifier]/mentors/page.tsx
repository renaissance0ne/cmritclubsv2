import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MentorsManagement } from '@/components/admin/mentors-management';

export default async function MentorsPage({
  params,
}: {
  params: { college: string; identifier: string };
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = await createClient();
  
  // Verify user is admin
  const { data: currentUser } = await supabase
    .from('officials')
    .select('official_role, display_name')
    .eq('clerk_id', userId)
    .single();

  if (!currentUser || currentUser.official_role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <MentorsManagement />
      </div>
    </div>
  );
}
