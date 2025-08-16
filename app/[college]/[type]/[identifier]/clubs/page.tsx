import { Suspense } from 'react';
import { ClubsList } from '@/components/clubs/clubs-list';
import { ClubsHeader } from '@/components/clubs/clubs-header';

export default async function ClubsPage({
  params
}: {
  params: Promise<{ college: string; type: string; identifier: string }>
}) {
  const { college, type, identifier } = await params;
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<ClubsListSkeleton />}>
        <ClubsList 
          college={college}
          officialType={type}
          officialRole={identifier}
        />
      </Suspense>
    </div>
  );
}

function ClubsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
