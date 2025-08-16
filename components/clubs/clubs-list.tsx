"use client";

import { useState, useEffect } from 'react';
import { ClubsHeader } from './clubs-header';
import { ClubCard } from './club-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Club {
  club_name: string;
  college: string;
  department: string;
  incharge_name: string;
  incharge_phone: string;
  member_count: number;
  created_at: string;
}

interface ClubsListProps {
  college: string;
  officialType: string;
  officialRole: string;
}

export function ClubsList({ college, officialType, officialRole }: ClubsListProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchClubs();
  }, [college, officialRole]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        college,
        officialRole,
      });

      // Add department for HODs
      if (officialRole.includes('_hod')) {
        const department = officialRole.replace('_hod', '');
        params.append('department', department);
      }

      const response = await fetch(`/api/clubs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch clubs');
      }

      const data = await response.json();
      setClubs(data.clubs || []);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError('Failed to load clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search clubs
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.incharge_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
                         club.department.toLowerCase() === filterBy.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <ClubsHeader 
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          currentFilter={filterBy}
          onFilter={setFilterBy}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ClubsHeader 
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          currentFilter={filterBy}
          onFilter={setFilterBy}
        />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClubsHeader 
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        currentFilter={filterBy}
        onFilter={setFilterBy}
      />

      {filteredClubs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
          <p className="text-gray-500">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No clubs are registered yet.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredClubs.length} of {clubs.length} clubs
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.club_name}
                club={club}
                college={college}
                officialType={officialType}
                officialRole={officialRole}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
