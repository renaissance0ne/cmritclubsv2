"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Calendar, Building2, Mail, FileText, AlertCircle } from 'lucide-react';

interface Club {
  club_name: string;
  college: string;
  department: string;
  incharge_name: string;
  incharge_phone: string;
  member_count: number;
  created_at: string;
  lead_info?: {
    name: string;
    department: string;
    year: number;
    phone: string;
    approval_status: string;
  } | null;
  activities?: {
    total_collections: number;
    pending_approvals: number;
  };
  club_id?: string | null;
}

interface ClubCardProps {
  club: Club;
  college: string;
  officialType: string;
  officialRole: string;
}

export function ClubCard({ club, college, officialType, officialRole }: ClubCardProps) {
  // Use club_id if available, otherwise fall back to club_name
  const clubIdentifier = club.club_id || club.club_name;
  const clubUrl = `/${college}/${officialType}/${officialRole}/clubs/${encodeURIComponent(clubIdentifier)}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentColor = (dept: string) => {
    const colors: { [key: string]: string } = {
      'cse': 'bg-blue-100 text-blue-800',
      'ece': 'bg-green-100 text-green-800',
      'mech': 'bg-orange-100 text-orange-800',
      'civil': 'bg-purple-100 text-purple-800',
      'eee': 'bg-red-100 text-red-800',
      'csd': 'bg-indigo-100 text-indigo-800',
      'csm': 'bg-pink-100 text-pink-800',
    };
    return colors[dept.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={clubUrl}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {club.club_name}
            </CardTitle>
            <div className="flex flex-col gap-1">
              <Badge className={getDepartmentColor(club.department)}>
                {club.department.toUpperCase()}
              </Badge>
              {club.lead_info?.approval_status && (
                <Badge className={getStatusColor(club.lead_info.approval_status)}>
                  {club.lead_info.approval_status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Lead Information */}
          {club.lead_info && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span className="font-medium">{club.lead_info.name}</span>
              <span className="ml-2 text-xs">({club.lead_info.department} - Year {club.lead_info.year})</span>
            </div>
          )}
          
          {/* Faculty In-charge */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="font-medium">{club.incharge_name}</span>
          </div>
          
          {/* Contact Information */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-2 h-4 w-4" />
            <span>{club.lead_info?.phone || club.incharge_phone}</span>
          </div>
          
          {/* Statistics Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-1 h-3 w-3" />
              <span>{club.member_count}</span>
            </div>
            
            {club.activities && (
              <>
                <div className="flex items-center text-muted-foreground">
                  <FileText className="mr-1 h-3 w-3" />
                  <span>{club.activities.total_collections}</span>
                </div>
                
                {club.activities.pending_approvals > 0 && (
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    <span>{club.activities.pending_approvals}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Creation Date */}
          <div className="flex items-center justify-end text-xs text-muted-foreground pt-1">
            <Calendar className="mr-1 h-3 w-3" />
            <span>{formatDate(club.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
