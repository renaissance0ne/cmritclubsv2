"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Calendar, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Letter {
  id: string;
  subject: string;
  recipients: string[];
  created_at: string;
  club_members_by_dept: Record<string, string[]>;
  approval_status: {
    overall_status: 'pending' | 'approved' | 'rejected';
    [key: string]: {
      status: 'pending' | 'approved' | 'rejected';
      comments?: string;
      updated_at?: string;
      official_id?: string;
      approved_members?: string[];
    } | string;
  };
}

interface LettersListProps {
  letters: Letter[];
  collectionName: string;
  college: string;
}

export function LettersList({ letters, collectionName, college }: LettersListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (letterId: string, letterSubject: string) => {
    setDeletingId(letterId);
    
    try {
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete letter');
      }

      toast.success(`Letter "${letterSubject}" deleted successfully`);
      // Use Next.js router to refresh the page properly
      router.refresh();
    } catch (error) {
      console.error('Error deleting letter:', error);
      toast.error('Failed to delete letter');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get overall status from approval_status
  const getOverallStatus = (approval_status: any): string => {
    if (approval_status && typeof approval_status === 'object') {
      // If overall_status exists, use it
      if (approval_status.overall_status) {
        return approval_status.overall_status;
      }
      
      // Otherwise, calculate it from individual official statuses
      const officialStatuses = Object.keys(approval_status)
        .filter(key => key !== 'overall_status')
        .map(key => {
          const status = approval_status[key];
          return typeof status === 'object' ? status.status : 'pending';
        });
      
      if (officialStatuses.length === 0) return 'pending';
      
      // If any official rejected, overall is rejected
      if (officialStatuses.some(status => status === 'rejected')) {
        return 'rejected';
      }
      
      // If all officials approved, overall is approved
      if (officialStatuses.every(status => status === 'approved')) {
        return 'approved';
      }
      
      // Otherwise, it's pending
      return 'pending';
    }
    return 'pending'; // Default fallback
  };

  // Helper function to get official approval status for display
  const getOfficialApprovalStatus = (letter: Letter, officialRole: string): string => {
    const approvalInfo = letter.approval_status?.[officialRole];
    if (typeof approvalInfo === 'object') {
      return approvalInfo.status || 'pending';
    }
    return 'pending';
  };

  const getRecipientDisplayNames = (recipients: string[]) => {
    const displayNames: Record<string, string> = {
      hs_hod: 'HS HOD',
      csm_hod: 'CSM HOD',
      cse_hod: 'CSE HOD',
      csd_hod: 'CSD HOD',
      ece_hod: 'ECE HOD',
      dean: 'Dean',
      tpo: 'TPO',
      director: 'Director'
    };
    
    return recipients.map(r => displayNames[r] || r).join(', ');
  };

  const getOfficialDisplayName = (officialKey: string): string => {
    const displayNames: Record<string, string> = {
      hs_hod: 'HS HOD',
      csm_hod: 'CSM HOD',
      cse_hod: 'CSE HOD',
      csd_hod: 'CSD HOD',
      ece_hod: 'ECE HOD',
      dean: 'Dean',
      tpo: 'TPO',
      director: 'Director'
    };
    
    return displayNames[officialKey] || officialKey.toUpperCase();
  };

  const getApprovalStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTotalMembers = (clubMembersByDept: Record<string, string[]>) => {
    return Object.values(clubMembersByDept).reduce((total, members) => total + members.length, 0);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (letters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No letters yet</h3>
          <p className="text-gray-600 mb-6">
            Start by drafting your first official letter for this collection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Letters</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {letters.map((letter) => (
          <div key={letter.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {letter.subject}
                  </h4>
                  <Badge className={getStatusColor(getOverallStatus(letter.approval_status))}>
                    {getOverallStatus(letter.approval_status).charAt(0).toUpperCase() + getOverallStatus(letter.approval_status).slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>To: {getRecipientDisplayNames(letter.recipients)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{getTotalMembers(letter.club_members_by_dept)} members</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(letter.created_at)}</span>
                  </div>
                </div>

                {/* Official Approval Statuses */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Official Approval Status:</h5>
                  <div className="space-y-2">
                    {letter.recipients.map((officialKey) => {
                      const officialStatus = getOfficialApprovalStatus(letter, officialKey);
                      const officialInfo = letter.approval_status?.[officialKey];
                      const approvedMembers = typeof officialInfo === 'object' ? officialInfo.approved_members : [];
                      
                      return (
                        <div key={officialKey} className="flex flex-col space-y-1 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {getOfficialDisplayName(officialKey)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getApprovalStatusColor(officialStatus)}`}
                            >
                              {officialStatus.charAt(0).toUpperCase() + officialStatus.slice(1)}
                            </Badge>
                          </div>
                          
                          {/* Show approved members if any */}
                          {approvedMembers && approvedMembers.length > 0 && (
                            <div className="text-xs text-green-600">
                              <span className="font-medium">Approved Members:</span> {approvedMembers.join(', ')}
                            </div>
                          )}
                          
                          {/* Show timestamp if available */}
                          {typeof officialInfo === 'object' && officialInfo.updated_at && (
                            <div className="text-xs text-gray-500">
                              {formatDate(officialInfo.updated_at)}
                            </div>
                          )}
                          
                          {/* Show comments if any */}
                          {typeof officialInfo === 'object' && officialInfo.comments && (
                            <div className="text-xs text-gray-600 italic">
                              "{officialInfo.comments}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId === letter.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Letter</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the letter "{letter.subject}"? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id, letter.subject)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
