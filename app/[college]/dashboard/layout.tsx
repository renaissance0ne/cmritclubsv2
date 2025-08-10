import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ClubLeaderSidebar } from '@/components/ui/club-leader-sidebar';
import { validateClubRoute } from '@/lib/utils/route-validation';

interface ClubLeaderLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    college: string;
  }>;
}

export default async function ClubLeaderLayout({ children, params }: ClubLeaderLayoutProps) {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect('/sign-in');
  }

  const { college } = await params;
  
  // Validate the college parameter for club routes
  const validation = validateClubRoute(college);
  if (!validation.isValid) {
    redirect('/404');
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username || user.emailAddresses[0]?.emailAddress || 'Club Leader';

  return (
    <div className="flex h-screen bg-gray-100">
      <ClubLeaderSidebar 
        displayName={displayName}
        college={college}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
