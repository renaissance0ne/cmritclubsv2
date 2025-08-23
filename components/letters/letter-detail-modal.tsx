"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Users, Mail, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { Letter, Official } from '@/lib/types';

interface LetterDetailModalProps {
  letter: Letter;
  currentOfficial: Official;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export function LetterDetailModal({ 
  letter, 
  currentOfficial, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: LetterDetailModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Check if current official is HOD
  const isHOD = currentOfficial.official_role.includes('_hod');
  
  // Get department code from HOD role
  const getDepartmentCode = (hodRole: string) => {
    return hodRole.replace('_hod', '').toUpperCase();
  };
  const isSeniorOfficial = ['director', 'dean', 'tpo'].includes(currentOfficial.official_role);
  
  const currentOfficialStatus = letter.approval_status?.[currentOfficial.official_role];
  const currentStatus = (typeof currentOfficialStatus === 'object' ? currentOfficialStatus?.status : 'pending') || 'pending';

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTotalMembers = (clubMembersByDept: Record<string, string[]>) => {
    return Object.values(clubMembersByDept).reduce((total, members) => total + members.length, 0);
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

  const getApprovalStatusColor = (status: 'pending' | 'approved' | 'rejected'): string => {
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

  const getDepartmentStudents = (department: string) => {
    const deptKey = department.toUpperCase();
    return letter.club_members_by_dept[deptKey] || [];
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    
    try {
      // For HODs approving, include selected members
      const approvedMembers = action === 'approve' && isHOD ? selectedMembers : [];
      
      const response = await fetch('/api/letters/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letter.id,
          officialRole: currentOfficial.official_role,
          action,
          approvedMembers,
          comment: comment.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }

      const result = await response.json();
      
      // Reset form
      setComment('');
      setSelectedMembers([]);
      
      // Notify parent component to refresh data
      onStatusUpdate();
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Failed to update approval status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Letter Review</span>
          </DialogTitle>
          <DialogDescription>
            Review the letter details and provide your approval or rejection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Letter Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{letter.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span><strong>Club Leader:</strong> {letter.collections.profiles.full_name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span><strong>Collection:</strong> {letter.collections.name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span><strong>Total Members:</strong> {getTotalMembers(letter.club_members_by_dept)}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span><strong>Created:</strong> {formatDate(letter.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Letter Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Letter Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {letter.body}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Members (for HODs) */}
          {isHOD && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {getDepartmentCode(currentOfficial.official_role)} Department Members
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Select the students you want to approve for this letter:
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getDepartmentStudents(currentOfficial.official_role.replace('_hod', '')).map((studentId, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`student-${studentId}`}
                          checked={selectedMembers.includes(studentId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, studentId]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== studentId));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`student-${studentId}`} className="text-sm font-medium text-gray-900">
                          Student ID: {studentId}
                        </label>
                      </div>
                      <Badge variant="outline">
                        {getDepartmentCode(currentOfficial.official_role)}
                      </Badge>
                    </div>
                  ))}
                  {getDepartmentStudents(currentOfficial.official_role.replace('_hod', '')).length === 0 && (
                    <p className="text-sm text-gray-500">No students from your department in this letter.</p>
                  )}
                  
                  {getDepartmentStudents(currentOfficial.official_role.replace('_hod', '')).length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Selected: {selectedMembers.length} of {getDepartmentStudents(currentOfficial.official_role.replace('_hod', '')).length} students
                        </span>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMembers(getDepartmentStudents(currentOfficial.official_role.replace('_hod', '')))}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMembers([])}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {letter.recipients.map((officialKey) => {
                  const approvalInfo = letter.approval_status?.[officialKey];
                  const status = (typeof approvalInfo === 'object' ? approvalInfo?.status : 'pending') || 'pending';
                  const isCurrentOfficial = officialKey === currentOfficial.official_role;
                  
                  return (
                    <div key={officialKey} className={`p-3 rounded-lg border ${isCurrentOfficial ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {getOfficialDisplayName(officialKey)}
                        {isCurrentOfficial && <span className="text-blue-600 ml-1">(You)</span>}
                      </div>
                      <Badge className={getApprovalStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      {typeof approvalInfo === 'object' && approvalInfo?.updated_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(approvalInfo.updated_at)}
                        </div>
                      )}
                      {typeof approvalInfo === 'object' && approvalInfo?.comments && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          "{approvalInfo.comments}"
                        </div>
                      )}
                      {typeof approvalInfo === 'object' && approvalInfo?.approved_members && approvalInfo.approved_members.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Approved {approvalInfo.approved_members.length} students
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Section */}
          {currentStatus === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment">Comment (Required for rejection)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add a comment about your decision..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isHOD ? (
                    <>
                      <Button
                        onClick={() => handleApproval('approve')}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? 'Processing...' : `Approve Selected Students (${selectedMembers.length})`}
                      </Button>
                      <Button
                        onClick={() => handleApproval('reject')}
                        disabled={isSubmitting || !comment.trim()}
                        variant="destructive"
                      >
                        {isSubmitting ? 'Processing...' : 'Reject Letter'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleApproval('approve')}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? 'Processing...' : 'Approve Letter'}
                      </Button>
                      <Button
                        onClick={() => handleApproval('reject')}
                        disabled={isSubmitting || !comment.trim()}
                        variant="destructive"
                      >
                        {isSubmitting ? 'Processing...' : 'Reject Letter'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Display for Already Decided */}
          {currentStatus !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge className={getApprovalStatusColor(currentStatus)}>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    You have already {currentStatus} this letter.
                  </span>
                </div>
                {(() => {
                  const officialStatus = letter.approval_status?.[currentOfficial.official_role];
                  return typeof officialStatus === 'object' && officialStatus.comments && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Your comment:</strong> "{officialStatus.comments}"
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
