"use client";

import React, { useState, useEffect } from 'react';
import { ClubMember, College, DEPARTMENT_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface InChargeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubName: string;
  college: College;
  currentInCharge: ClubMember | null;
  onUpdate: (inCharge: ClubMember) => void;
}

export function InChargeSelectionModal({
  isOpen,
  onClose,
  clubName,
  college,
  currentInCharge,
  onUpdate
}: InChargeSelectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    incharge_name: '',
    department: 'cse' as any,
    email: '',
    phone: '',
    incharge_phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (currentInCharge) {
        setFormData({
          name: currentInCharge.name,
          incharge_name: currentInCharge.incharge_name || '',
          department: currentInCharge.department,
          email: currentInCharge.email || '',
          phone: currentInCharge.phone || '',
          incharge_phone: currentInCharge.incharge_phone || ''
        });
      } else {
        setFormData({
          name: '',
          incharge_name: '',
          department: 'cse',
          email: '',
          phone: '',
          incharge_phone: ''
        });
      }
    }
  }, [isOpen, currentInCharge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.incharge_name.trim()) {
      toast.error('Faculty name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/members/incharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          club_name: clubName,
          college: college,
          current_incharge_id: currentInCharge?.id,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign in-charge');
      }

      const result = await response.json();
      console.log('In-charge assignment result:', result);
      onUpdate(result);
      toast.success('Club in-charge has been assigned successfully');
      onClose();
    } catch (error) {
      console.error('Error assigning in-charge:', error);
      toast.error('Failed to assign in-charge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentInCharge ? 'Edit Club In-charge' : 'Assign Club In-charge'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Faculty Name */}
          <div>
            <Label htmlFor="incharge_name">Faculty Name *</Label>
            <Input
              id="incharge_name"
              value={formData.incharge_name}
              onChange={(e) => setFormData(prev => ({ ...prev, incharge_name: e.target.value }))}
              placeholder="Enter faculty member's full name"
              required
            />
          </div>

          {/* Department */}
          <div>
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData(prev => ({ ...prev, department: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cse">CSE</SelectItem>
                <SelectItem value="csm">CSM</SelectItem>
                <SelectItem value="hs">HS</SelectItem>
                <SelectItem value="ece">ECE</SelectItem>
                <SelectItem value="csd">CSD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="faculty@cmrit.ac.in (optional)"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="incharge_phone">Phone Number</Label>
            <Input
              id="incharge_phone"
              value={formData.incharge_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, incharge_phone: e.target.value }))}
              placeholder="+91 9876543210 (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (currentInCharge ? 'Update In-charge' : 'Assign In-charge')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
