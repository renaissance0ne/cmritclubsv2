import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { validateClubRoute } from '@/lib/utils/route-validation';
import { createClient } from '@/lib/supabase/server';
import { CollectionsGrid } from '@/components/collections/collections-grid';
import { CreateCollectionButton } from '@/components/collections/create-collection-button';

interface CollectionsPageProps {
  params: Promise<{
    college: string;
  }>;
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
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

  // Get the club leader's profile to verify they're approved
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', userId)
    .eq('college', validCollege)
    .single();

  if (profileError || !profile) {
    redirect('/sign-in');
  }

  // Check if the club leader is approved
  const approvalStatus = profile.approval_status as any;
  
  // Check if all required approvals are approved
  const requiredApprovals = ['tpo', 'dean', 'hsHod', 'csdHod', 'cseHod', 'csmHod', 'eceHod', 'director'];
  const allApproved = requiredApprovals.every(role => 
    approvalStatus?.[role]?.status === 'approved'
  );
  
  if (!allApproved) {
    redirect(`/${validCollege}/dashboard`);
  }

  // Fetch collections for this club leader
  const { data: collectionsData, error: collectionsError } = await supabase
    .from('collections')
    .select('*')
    .eq('club_id', profile.id)
    .eq('college', validCollege)
    .order('created_at', { ascending: false });

  // Get letter counts for each collection
  let collections = collectionsData;
  if (collectionsData && collectionsData.length > 0) {
    const collectionsWithCounts = await Promise.all(
      collectionsData.map(async (collection) => {
        const { count } = await supabase
          .from('letters')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);
        
        return {
          ...collection,
          letter_count: count || 0
        };
      })
    );
    collections = collectionsWithCounts;
  }

  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
  }

  // Debug logging for letter counts
  if (collections && collections.length > 0) {
    console.log('Collections with letter counts:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}: ${collection.letter_count || 0} letters`);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
            <p className="text-gray-600 mt-2">
              Organize your official letters by creating collections for different events
            </p>
          </div>
          <CreateCollectionButton college={validCollege} />
        </div>

        {/* Collections Grid */}
        <CollectionsGrid 
          collections={collections || []} 
          college={validCollege}
        />
      </div>
    </div>
  );
}
