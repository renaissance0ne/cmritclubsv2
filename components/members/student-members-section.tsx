"use client";

import { useState } from 'react';
import { ClubMember, ClubCustomRole, College, DEPARTMENT_NAMES, YEAR_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Users, Plus, Search, Edit, Trash2, AlertCircle, Settings } from 'lucide-react';
import { AddEditMemberModal } from './add-edit-member-modal';
import { toast } from 'sonner';

// Helper function to format dates consistently for SSR/client hydration
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

interface StudentMembersSectionProps {
  clubName: string;
  college: College;
  members: ClubMember[];
  customRoles: ClubCustomRole[];
  onMembersUpdate: (members: ClubMember[]) => void;
  onRolesUpdate: (roles: ClubCustomRole[]) => void;
  hasInCharge: boolean;
}

export function StudentMembersSection({
  clubName,
  college,
  members,
  customRoles,
  onMembersUpdate,
  onRolesUpdate,
  hasInCharge
}: StudentMembersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  console.log('StudentMembersSection: hasInCharge =', hasInCharge);
  console.log('StudentMembersSection: members array =', members);

  const filteredMembers = members.filter(member => {
    // Skip if member is null/undefined or missing required properties
    if (!member || !member.name || !member.department) {
      return false;
    }
    
    return (
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.roll_number && member.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.section && member.section.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleAddMember = () => {
    if (!hasInCharge) {
      toast.error('Please assign a club in-charge before adding members');
      return;
    }
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: ClubMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (member: ClubMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the club?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/members/students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: member.id,
          club_name: clubName,
          college: college
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      const updatedMembers = members.filter(m => m.id !== member.id);
      onMembersUpdate(updatedMembers);
      toast.success(`${member.name} has been removed from the club`);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberUpdate = (updatedMember: ClubMember, isNew: boolean) => {
    console.log('handleMemberUpdate:', { updatedMember, isNew });
    
    // Validate the updated member has required properties
    if (!updatedMember || !updatedMember.id || !updatedMember.name) {
      console.error('Invalid member data received:', updatedMember);
      return;
    }
    
    if (isNew) {
      // Filter out any null/undefined members and add the new one
      const validMembers = members.filter(m => m && m.id && m.name);
      onMembersUpdate([updatedMember, ...validMembers]);
    } else {
      const updatedMembers = members.map(m => 
        m && m.id === updatedMember.id ? updatedMember : m
      ).filter(m => m && m.id && m.name); // Filter out any invalid members
      onMembersUpdate(updatedMembers);
    }
    setIsModalOpen(false);
    setEditingMember(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Members
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </Badge>
            </CardTitle>
            <Button
              onClick={handleAddMember}
              disabled={!hasInCharge}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
          
          {!hasInCharge && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Please assign a club in-charge before adding student members.
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members by name, roll number, department, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {members.length === 0 ? 'No Members Yet' : 'No Members Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {members.length === 0 
                  ? 'Start building your club by adding student members.'
                  : 'No members match your search criteria.'
                }
              </p>
              {members.length === 0 && hasInCharge && (
                <Button onClick={handleAddMember} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="font-mono text-sm">{member.roll_number || '-'}</TableCell>
                      <TableCell>
                        {member.year ? (
                          <Badge variant="outline">
                            {YEAR_NAMES[member.year]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{DEPARTMENT_NAMES[member.department]}</TableCell>
                      <TableCell>{member.section || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(member.joined_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clubName={clubName}
        college={college}
        member={editingMember}
        existingMembers={members}
        onUpdate={handleMemberUpdate}
      />
    </>
  );
}
