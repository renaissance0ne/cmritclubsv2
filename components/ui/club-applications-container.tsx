"use client";

import { useState } from "react";
import { ClubApplicationsList } from "./club-applications-list";
import { getCategorizedApplications } from "@/lib/actions/officials.actions";

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

interface ClubApplicationsContainerProps {
  pending: ClubApplication[];
  approved: ClubApplication[];
  rejected: ClubApplication[];
  officialRole?: string;
  department?: string;
}

export function ClubApplicationsContainer({ 
  pending: initialPending, 
  approved: initialApproved, 
  rejected: initialRejected,
  officialRole,
  department
}: ClubApplicationsContainerProps) {
  const [applications, setApplications] = useState({
    pending: initialPending,
    approved: initialApproved,
    rejected: initialRejected
  });

  const handleStatusUpdate = async () => {
    try {
      if (officialRole) {
        const categorizedApps = await getCategorizedApplications(officialRole, department);
        setApplications(categorizedApps);
      }
    } catch (err) {
      console.error('Error refreshing applications:', err);
    }
  };

  return (
    <ClubApplicationsList
      pending={applications.pending}
      approved={applications.approved}
      rejected={applications.rejected}
      onStatusUpdate={handleStatusUpdate}
    />
  );
}
