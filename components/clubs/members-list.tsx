"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, GraduationCap } from 'lucide-react';

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

interface MembersListProps {
  membersByRole: { [key: string]: ClubMember[] };
  totalMembers: number;
}

export function MembersList({ membersByRole, totalMembers }: MembersListProps) {
  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'lead': 'bg-blue-100 text-blue-800',
      'leader': 'bg-blue-100 text-blue-800',
      'coordinator': 'bg-green-100 text-green-800',
      'member': 'bg-gray-100 text-gray-800',
      'incharge': 'bg-purple-100 text-purple-800',
      'secretary': 'bg-orange-100 text-orange-800',
      'treasurer': 'bg-yellow-100 text-yellow-800',
    };
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort roles to show leadership first
  const sortedRoles = Object.keys(membersByRole).sort((a, b) => {
    const priority: { [key: string]: number } = {
      'incharge': 1,
      'lead': 2,
      'leader': 2,
      'coordinator': 3,
      'secretary': 4,
      'treasurer': 5,
      'member': 6
    };
    return (priority[a.toLowerCase()] || 10) - (priority[b.toLowerCase()] || 10);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Club Members</h3>
        <Badge variant="secondary">{totalMembers} Total Members</Badge>
      </div>

      {sortedRoles.map((role) => {
        const members = membersByRole[role];
        if (!members || members.length === 0) return null;

        return (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  {formatRole(role)}s
                  <Badge variant="secondary" className={`ml-2 ${getRoleColor(role)}`}>
                    {members.length}
                  </Badge>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <Badge variant="secondary" className={getRoleColor(member.role)}>
                          {formatRole(member.role)}
                        </Badge>
                      </div>
                      
                      {member.roll_number && (
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <GraduationCap className="mr-1 h-3 w-3" />
                          {member.roll_number}
                          {member.year && ` • Year ${member.year}`}
                          {member.section && ` • Section ${member.section}`}
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Mail className="mr-1 h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Phone className="mr-1 h-3 w-3" />
                        {member.phone}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="mr-1 h-3 w-3" />
                        Joined {formatDate(member.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {sortedRoles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No members found for this club.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
