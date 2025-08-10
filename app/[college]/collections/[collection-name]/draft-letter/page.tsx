import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { validateClubRoute } from '@/lib/utils/route-validation';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { LetterDraftForm } from '@/components/collections/letter-draft-form';

interface DraftLetterPageProps {
  params: Promise<{
    college: string;
    'collection-name': string;
  }>;
}

export default async function DraftLetterPage({ params }: DraftLetterPageProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href={`/${validCollege}/collections`} className="hover:text-gray-900">
            Collections
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link 
            href={`/${validCollege}/collections/${encodeURIComponent(collection.name)}`}
            className="hover:text-gray-900"
          >
            {collection.name}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Draft Letter</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Draft New Letter</h1>
          <p className="text-gray-600 mt-2">
            Create an official letter for {collection.name}
          </p>
        </div>

        {/* Letter Draft Form */}
        <LetterDraftForm 
          collection={collection}
          profile={profile}
          college={validCollege}
        />
      </div>
    </div>
  );
}
