"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Users, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { LetterDetailModal } from './letter-detail-modal';
import { Letter, Official } from '@/lib/types';

interface LettersManagementProps {
  letters: Letter[];
  currentOfficial: Official;
}

export function LettersManagement({ letters, currentOfficial }: LettersManagementProps) {
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper functions
  const getOfficialStatus = (letter: Letter): 'pending' | 'approved' | 'rejected' => {
    const status = letter.approval_status?.[currentOfficial.official_role];
    if (typeof status === 'object' && status !== null && 'status' in status) {
      return status.status;
    }
    return 'pending';
  };

  const isHOD = currentOfficial.official_role.includes('_hod');
  const isSeniorOfficial = ['director', 'dean', 'tpo'].includes(currentOfficial.official_role);

  // Filter letters by status
  const pendingLetters = letters.filter(letter => getOfficialStatus(letter) === 'pending');
  const approvedLetters = letters.filter(letter => getOfficialStatus(letter) === 'approved');
  const rejectedLetters = letters.filter(letter => getOfficialStatus(letter) === 'rejected');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTotalMembers = (clubMembersByDept: Record<string, string[]>) => {
    return Object.values(clubMembersByDept).reduce((total, members) => total + members.length, 0);
  };

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setIsModalOpen(true);
  };

  const renderLetterCard = (letter: Letter) => {
    const status = getOfficialStatus(letter);
    
    return (
      <Card key={letter.id} className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {letter.subject}
                </h3>
                <Badge className={getStatusColor(status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(status)}
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </div>
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <strong>Collection:</strong> {letter.collections.name}
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <strong>Club Leader:</strong> {letter.collections.profiles.full_name} ({letter.collections.profiles.department})
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{getTotalMembers(letter.club_members_by_dept)} members</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(letter.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleLetterClick(letter)}
            >
              Review Letter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLetterSection = (letters: Letter[], title: string, description: string) => {
    if (letters.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} letters</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {letters.map(renderLetterCard)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingLetters.length}</div>
            <p className="text-xs text-gray-600">Letters awaiting your approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedLetters.length}</div>
            <p className="text-xs text-gray-600">Letters you have approved</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedLetters.length}</div>
            <p className="text-xs text-gray-600">Letters you have rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Letters Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pending ({pendingLetters.length})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Approved ({approvedLetters.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Rejected ({rejectedLetters.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {renderLetterSection(
            pendingLetters, 
            "Pending", 
            "No letters are currently pending your review."
          )}
        </TabsContent>

        <TabsContent value="approved">
          {renderLetterSection(
            approvedLetters, 
            "Approved", 
            "You haven't approved any letters yet."
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {renderLetterSection(
            rejectedLetters, 
            "Rejected", 
            "You haven't rejected any letters yet."
          )}
        </TabsContent>
      </Tabs>

      {/* Letter Detail Modal */}
      {selectedLetter && (
        <LetterDetailModal
          letter={selectedLetter}
          currentOfficial={currentOfficial}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLetter(null);
          }}
          onStatusUpdate={() => {
            // Refresh the page or update the letters list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
