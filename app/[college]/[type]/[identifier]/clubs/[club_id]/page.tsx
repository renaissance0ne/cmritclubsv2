"use client";

import { Suspense, useState, useEffect, use } from 'react';
import { ClubDetails } from '@/components/clubs/club-details';
import { ClubDetailsSkeleton } from '@/components/clubs/club-details-skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ClubDetailsPage({
  params
}: {
  params: Promise<{ 
    college: string; 
    type: string; 
    identifier: string; 
    club_id: string 
  }>
}) {
  const resolvedParams = use(params);
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<ClubDetailsSkeleton />}>
        <ClubDetailsWrapper 
          clubId={resolvedParams.club_id}
          college={resolvedParams.college}
          officialType={resolvedParams.type}
          officialRole={resolvedParams.identifier}
        />
      </Suspense>
    </div>
  );
}

function ClubDetailsWrapper({ 
  clubId, 
  college, 
  officialType, 
  officialRole 
}: {
  clubId: string;
  college: string;
  officialType: string;
  officialRole: string;
}) {
  const [clubName, setClubName] = useState<string>('Loading...');
  
  useEffect(() => {
    // Fetch club name for breadcrumb and header
    const fetchClubName = async () => {
      try {
        const params = new URLSearchParams({
          college,
          officialRole,
        });
        
        const response = await fetch(`/api/clubs/${encodeURIComponent(clubId)}?${params}`);
        if (response.ok) {
          const data = await response.json();
          setClubName(data.club?.club_name || 'Unknown Club');
        }
      } catch (error) {
        console.error('Error fetching club name:', error);
        setClubName('Unknown Club');
      }
    };
    
    fetchClubName();
  }, [clubId, college, officialRole]);
  
  const breadcrumbItems = [
    { label: 'Dashboard', href: `/${college}/${officialType}/${officialRole}/dashboard` },
    { label: 'Clubs', href: `/${college}/${officialType}/${officialRole}/clubs` },
    { label: clubName, href: '#', current: true }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{clubName}</h1>
          <p className="text-muted-foreground">
            Club details, members, and collections
          </p>
        </div>
      </div>

      <ClubDetails 
        clubId={clubId}
        college={college}
        officialType={officialType}
        officialRole={officialRole}
      />
    </>
  );
}
