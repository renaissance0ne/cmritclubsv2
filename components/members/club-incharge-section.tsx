"use client";

import { useState } from 'react';
import { ClubMember, College, DEPARTMENT_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Edit, Plus } from 'lucide-react';
import { InChargeSelectionModal } from './incharge-selection-modal';

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

interface ClubInChargeSectionProps {
  clubName: string;
  college: College;
  currentInCharge: ClubMember | null;
  onInChargeUpdate: (inCharge: ClubMember | null) => void;
}

export function ClubInChargeSection({
  clubName,
  college,
  currentInCharge,
  onInChargeUpdate
}: ClubInChargeSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInChargeUpdate = (newInCharge: ClubMember) => {
    console.log('ClubInChargeSection: Updating in-charge:', newInCharge);
    onInChargeUpdate(newInCharge);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Club In-charge
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                Mandatory
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {currentInCharge ? (
                <>
                  <Edit className="w-4 h-4" />
                  Edit
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add In-charge
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentInCharge ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {currentInCharge.incharge_name || currentInCharge.name}
                  </h3>
                  <p className="text-gray-600">
                    {DEPARTMENT_NAMES[currentInCharge.department]} Department
                  </p>
                </div>
                <div className="space-y-2">
                  {currentInCharge.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {currentInCharge.email}
                    </div>
                  )}
                  {(currentInCharge.incharge_phone || currentInCharge.phone) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {currentInCharge.incharge_phone || currentInCharge.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500" suppressHydrationWarning>
                Assigned on {formatDate(currentInCharge.joined_at)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No In-charge Assigned
              </h3>
              <p className="text-gray-600 mb-4">
                A faculty in-charge must be assigned before adding student members.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Assign In-charge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <InChargeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clubName={clubName}
        college={college}
        currentInCharge={currentInCharge}
        onUpdate={handleInChargeUpdate}
      />
    </>
  );
}
