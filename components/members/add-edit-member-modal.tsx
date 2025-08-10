"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClubMember, College, VALID_DEPARTMENTS, STUDENT_YEARS, DEPARTMENT_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roll_number: z.string().min(1, 'Roll number is required').regex(/^[A-Za-z0-9]+$/, 'Roll number must be alphanumeric'),
  year: z.number().min(1).max(4),
  department: z.enum(['cse', 'csm', 'hs', 'ece', 'csd']),
  section: z.string().optional(),
  role: z.string()
    .min(2, 'Role must be at least 2 characters')
    .max(50, 'Role must be less than 50 characters')
    .regex(/^[a-zA-Z\s&-]+$/, 'Role can only contain letters, spaces, hyphens, and ampersands')
    .transform(val => val.trim()),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional()
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubName: string;
  college: College;
  member: ClubMember | null;
  existingMembers: ClubMember[];
  onUpdate: (member: ClubMember, isNew: boolean) => void;
}

export function AddEditMemberModal({
  isOpen,
  onClose,
  clubName,
  college,
  member,
  existingMembers,
  onUpdate
}: AddEditMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      roll_number: '',
      year: 1,
      department: 'cse',
      section: '',
      role: 'member',
      email: '',
      phone: ''
    }
  });

  const watchedYear = watch('year');
  const watchedDepartment = watch('department');

  useEffect(() => {
    if (isOpen) {
      if (member) {
        // Editing existing member
        setValue('name', member.name);
        setValue('roll_number', member.roll_number || '');
        setValue('year', member.year || 1);
        setValue('department', member.department);
        setValue('section', member.section || '');
        setValue('role', member.role);
        setValue('email', member.email || '');
        setValue('phone', member.phone || '');
      } else {
        // Adding new member
        reset({
          name: '',
          roll_number: '',
          year: 1,
          department: 'cse',
          section: '',
          email: '',
          phone: ''
        });
      }
    }
  }, [isOpen, member, setValue, reset]);

  const onSubmit = async (data: MemberFormData) => {
    // Check for duplicate roll numbers (excluding current member if editing)
    const duplicateRollNumber = existingMembers.find(m => 
      m.roll_number && m.roll_number.toLowerCase() === data.roll_number.toLowerCase() && 
      (!member || m.id !== member.id)
    );

    if (duplicateRollNumber) {
      toast.error('A member with this roll number already exists in the club');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/members/students', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          club_name: clubName,
          college: college,
          member_id: member?.id,
          email: data.email || null,
          phone: data.phone || null,
          section: data.section || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save member');
      }

      const result = await response.json();
      console.log('API response result:', result);
      onUpdate(result, !isEditing);
      toast.success(`Member ${isEditing ? 'updated' : 'added'} successfully`);
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Roll Number */}
          <div>
            <Label htmlFor="roll_number">Roll Number *</Label>
            <Input
              id="roll_number"
              {...register('roll_number')}
              placeholder="e.g., 21CS101"
              className="font-mono"
            />
            {errors.roll_number && (
              <p className="text-sm text-red-600 mt-1">{errors.roll_number.message}</p>
            )}
          </div>

          {/* Year and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Select
                value={watchedYear?.toString()}
                onValueChange={(value) => setValue('year', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year && (
                <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={watchedDepartment}
                onValueChange={(value) => setValue('department', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
              )}
            </div>
          </div>

          {/* Section */}
          <div>
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              {...register('section')}
              placeholder="e.g., A, B, C (optional)"
            />
            {errors.section && (
              <p className="text-sm text-red-600 mt-1">{errors.section.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="Type a role (e.g., President, Event Coordinator, Tech Lead)..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter any role name. Examples: Secretary, Treasurer, Cultural Head, Marketing Lead
            </p>
            {errors.role && (
              <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="student@example.com (optional)"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+91 9876543210 (optional)"
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update Member' : 'Add Member')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
