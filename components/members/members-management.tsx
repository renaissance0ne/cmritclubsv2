"use client";

import { useState } from 'react';
import { ClubMember, ClubCustomRole, College } from '@/lib/types';
import { ClubInChargeSection } from './club-incharge-section';
import { StudentMembersSection } from './student-members-section';

interface MembersManagementProps {
  clubName: string;
  college: College;
  currentInCharge: ClubMember | null;
  members: ClubMember[];
  customRoles: ClubCustomRole[];
}

export function MembersManagement({
  clubName,
  college,
  currentInCharge,
  members,
  customRoles
}: MembersManagementProps) {
  const [inCharge, setInCharge] = useState<ClubMember | null>(currentInCharge);
  const [studentMembers, setStudentMembers] = useState<ClubMember[]>(members);
  const [roles, setRoles] = useState<ClubCustomRole[]>(customRoles);

  const handleInChargeUpdate = (newInCharge: ClubMember | null) => {
    console.log('MembersManagement: Received in-charge update:', newInCharge);
    console.log('MembersManagement: hasInCharge will be:', !!newInCharge);
    setInCharge(newInCharge);
  };

  return (
    <div className="space-y-8">
      {/* Club In-charge Section */}
      <ClubInChargeSection
        clubName={clubName}
        college={college}
        currentInCharge={inCharge}
        onInChargeUpdate={handleInChargeUpdate}
      />

      {/* Student Members Section */}
      <StudentMembersSection
        clubName={clubName}
        college={college}
        members={studentMembers}
        customRoles={roles}
        onMembersUpdate={setStudentMembers}
        onRolesUpdate={setRoles}
        hasInCharge={!!inCharge}
      />
    </div>
  );
}
