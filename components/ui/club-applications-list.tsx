"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  GraduationCap,
  Calendar,
  FileText,
  ExternalLink
} from "lucide-react";
import { updateApplicationStatus } from "@/lib/actions/officials.actions";
import { toast } from "sonner";

interface ClubApplication {
  id: string;
  clerk_id: string;
  full_name: string;
  phone_number: string;
  roll_number: string;
  department: string;
  year_of_study: number;
  expected_graduation: string;
  club_name: string;
  faculty_in_charge: string;
  proof_letter_url: string;
  approval_status: any;
  created_at: string;
  updated_at: string;
}

interface ClubApplicationsListProps {
  pending: ClubApplication[];
  approved: ClubApplication[];
  rejected: ClubApplication[];
  onStatusUpdate: () => void;
}

export function ClubApplicationsList({ 
  pending, 
  approved, 
  rejected, 
  onStatusUpdate 
}: ClubApplicationsListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  // Add safety checks for undefined arrays
  const safePending = pending || [];
  const safeApproved = approved || [];
  const safeRejected = rejected || [];

  const handleStatusUpdate = async (
    profileId: string, 
    status: 'approved' | 'rejected',
    comment?: string
  ) => {
    // Validate comment for rejection
    if (status === 'rejected' && (!comment || comment.trim() === '')) {
      toast.error("Comments are required when rejecting an application");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [profileId]: true }));

    try {
      const result = await updateApplicationStatus(profileId, status, comment);
      
      if (result.success) {
        toast.success(`Application ${status} successfully`);
        setComments(prev => ({ ...prev, [profileId]: '' }));
        onStatusUpdate();
      } else {
        toast.error(result.error || "Failed to update application status");
      }
    } catch (error) {
      toast.error("An error occurred while updating the application");
    } finally {
      setLoadingStates(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const ApplicationCard = ({ application, showActions = false }: { 
    application: ClubApplication; 
    showActions?: boolean;
  }) => {
    const isLoading = loadingStates[application.id];
    const comment = comments[application.id] || '';

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{application.club_name}</CardTitle>
            <Badge variant="outline">
              {application.department} - Year {application.year_of_study}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <strong>{application.full_name}</strong> ({application.roll_number})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{application.phone_number}</span>
            </div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Faculty: {application.faculty_in_charge}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Graduation: {new Date(application.expected_graduation).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'numeric', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Proof Letter */}
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <a 
              href={application.proof_letter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
            >
              <span>View Proof Letter</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Application Date */}
          <div className="text-xs text-gray-500">
            Applied: {new Date(application.created_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'numeric', 
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: true
            })}
          </div>

          {/* Actions for pending applications */}
          {showActions && (
            <div className="pt-4 border-t space-y-3">
              <div>
                <Label htmlFor={`comment-${application.id}`}>Comments</Label>
                <Textarea
                  id={`comment-${application.id}`}
                  placeholder="Add comments (required for rejection)..."
                  value={comment}
                  onChange={(e) => setComments(prev => ({ 
                    ...prev, 
                    [application.id]: e.target.value 
                  }))}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleStatusUpdate(application.id, 'approved', comment)}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isLoading ? 'Processing...' : 'Approve'}</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(application.id, 'rejected', comment)}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isLoading ? 'Processing...' : 'Reject'}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pending ({safePending.length})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Approved ({safeApproved.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Rejected ({safeRejected.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {safePending.length === 0 ? (
            <EmptyState message="No pending applications to review" />
          ) : (
            <div>
              {safePending.map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application} 
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {safeApproved.length === 0 ? (
            <EmptyState message="No approved applications" />
          ) : (
            <div>
              {safeApproved.map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {safeRejected.length === 0 ? (
            <EmptyState message="No rejected applications" />
          ) : (
            <div>
              {safeRejected.map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
