import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateOfficialRoute } from '@/lib/utils/route-validation';
import { LettersManagement } from '@/components/letters/letters-management';

interface LettersPageProps {
  params: Promise<{
    college: string;
    type: string;
    identifier: string;
  }>;
}

export default async function LettersPage({ params }: LettersPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const resolvedParams = await params;
  const { college, type, identifier } = resolvedParams;

  // Validate the route and get official info
  const routeValidation = await validateOfficialRoute(college, type, identifier);
  if (!routeValidation.isValid) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get the official's information
  const { data: official, error: officialError } = await supabase
    .from('officials')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (officialError || !official) {
    redirect('/');
  }

  // Fetch all letters - we'll filter on client side to avoid JSONB query issues
  const { data: letters, error: lettersError } = await supabase
    .from('letters')
    .select(`
      *,
      collections!inner(
        name,
        club_id,
        profiles!inner(
          full_name,
          department
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (lettersError) {
    console.error('Error fetching letters:', lettersError);
    // For now, continue with empty array to show the UI
    // In production, you might want to show an error page
  }

  // Filter letters on the client side as additional safety
  const filteredLetters = (letters || []).filter(letter => {
    if (!letter.recipients) return false;
    
    // Handle recipients as either string array or JSON string
    let recipientsList = [];
    if (typeof letter.recipients === 'string') {
      try {
        recipientsList = JSON.parse(letter.recipients);
      } catch (e) {
        console.warn('Failed to parse recipients JSON:', letter.recipients);
        return false;
      }
    } else if (Array.isArray(letter.recipients)) {
      recipientsList = letter.recipients;
    } else {
      return false;
    }
    
    return recipientsList.includes(official.official_role);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Letters Management</h1>
          <p className="text-gray-600 mt-2">
            Review and manage student letters requiring your approval
          </p>
        </div>

        <LettersManagement 
          letters={filteredLetters} 
          currentOfficial={official}
        />
      </div>
    </div>
  );
}
