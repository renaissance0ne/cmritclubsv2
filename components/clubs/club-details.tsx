"use client";

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Users, Mail, Phone, Calendar, FileText, User } from 'lucide-react';
import { MembersList } from '@/components/clubs/members-list';
import { CollectionsList } from '@/components/clubs/collections-list';

interface ClubMember {
  id: string;
  name: string;
  roll_number: string;
  year: number;
  department: string;
  section: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
  letter_count: number;
  created_at: string;
  letters: any[];
}

interface ClubDetailsData {
  club_name: string;
  college: string;
  total_members: number;
  members_by_role: { [key: string]: ClubMember[] };
  club_leads: ClubMember[];
  club_incharge: ClubMember[];
  collections: Collection[];
  department: string;
  created_at: string;
}

interface ClubDetailsProps {
  clubId: string;
  college: string;
  officialType: string;
  officialRole: string;
}

export function ClubDetails({ clubId, college, officialType, officialRole }: ClubDetailsProps) {
  const [clubData, setClubData] = useState<ClubDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        college,
        officialRole,
      });

      const response = await fetch(`/api/clubs/${encodeURIComponent(clubId)}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch club details');
      }

      const data = await response.json();
      setClubData(data.club);
    } catch (err) {
      console.error('Error fetching club details:', err);
      setError('Failed to load club details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clubId, college, officialRole]);

  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !clubData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Club not found'}</AlertDescription>
      </Alert>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Club Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubData.total_members}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Leads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubData.club_leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubData.collections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <Badge variant="secondary">{clubData.department?.toUpperCase()}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Established {formatDate(clubData.created_at)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Club Leadership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clubData.club_leads.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Club Leads</h4>
                {clubData.club_leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.roll_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{lead.email}</p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clubData.club_incharge.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Faculty Incharge</h4>
                {clubData.club_incharge.map((incharge) => (
                  <div key={incharge.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium">{incharge.name}</p>
                      <p className="text-sm text-muted-foreground">Faculty Incharge</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{incharge.email}</p>
                      <p className="text-sm text-muted-foreground">{incharge.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Letters</span>
              <span className="font-medium">
                {clubData.collections.reduce((sum, col) => sum + col.letter_count, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Collections</span>
              <span className="font-medium">{clubData.collections.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Roles</span>
              <span className="font-medium">{Object.keys(clubData.members_by_role).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <MembersList 
            membersByRole={clubData.members_by_role}
            totalMembers={clubData.total_members}
          />
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <CollectionsList 
            clubId={clubId}
            college={college}
            collections={clubData.collections}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
