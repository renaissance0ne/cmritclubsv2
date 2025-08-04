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
  status: string;
  created_at: string;
  club_members_by_dept: Record<string, string[]>;
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

  const getTotalMembers = (clubMembersByDept: Record<string, string[]>) => {
    return Object.values(clubMembersByDept).reduce((total, members) => total + members.length, 0);
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
                  <Badge className={getStatusColor(letter.status)}>
                    {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
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
                    <span>{new Date(letter.created_at).toLocaleDateString()}</span>
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
