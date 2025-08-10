import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { validateClubRoute } from '@/lib/utils/route-validation';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LettersList } from '@/components/collections/letters-list';

interface CollectionPageProps {
  params: Promise<{
    college: string;
    'collection-name': string;
  }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { college, 'collection-name': collectionName } = await params;
  
  // Validate the college parameter
  const validation = validateClubRoute(college);
  if (!validation.isValid) {
    redirect('/404');
  }

  const validCollege = validation.college!;
  const decodedCollectionName = decodeURIComponent(collectionName);
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

  // Fetch the collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('club_id', profile.id)
    .eq('name', decodedCollectionName)
    .eq('college', validCollege)
    .single();

  if (collectionError || !collection) {
    redirect(`/${validCollege}/collections`);
  }

  // Fetch letters for this collection
  const { data: letters, error: lettersError } = await supabase
    .from('letters')
    .select('*')
    .eq('collection_id', collection.id)
    .order('created_at', { ascending: false });

  if (lettersError) {
    console.error('Error fetching letters:', lettersError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href={`/${validCollege}/collections`} className="hover:text-gray-900">
            Collections
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{collection.name}</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
            <p className="text-gray-600 mt-2">
              Manage official letters for this collection
            </p>
          </div>
          <Link href={`/${validCollege}/collections/${encodeURIComponent(collection.name)}/draft-letter`}>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Draft New Letter
            </Button>
          </Link>
        </div>

        {/* Collection Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Collection Details</h3>
                <p className="text-gray-600">
                  Created on {new Date(collection.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{letters?.length || 0}</p>
              <p className="text-sm text-gray-600">Letters</p>
            </div>
          </div>
        </div>

        {/* Letters List */}
        <LettersList 
          letters={letters || []} 
          collectionName={collection.name}
          college={validCollege}
        />
      </div>
    </div>
  );
}
