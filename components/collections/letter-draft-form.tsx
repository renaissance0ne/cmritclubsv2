"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  club_id: string;
  college: string;
}

interface Profile {
  id: string;
  club_name: string;
  full_name: string;
}

interface LetterDraftFormProps {
  collection: Collection;
  profile: Profile;
  college: string;
}

interface LetterContent {
  recipients: string[];
  subject: string;
  body: string;
}

interface ClubMembersByDept {
  HS: string[];
  CSE: string[];
  CSM: string[];
  CSD: string[];
  ECE: string[];
}

const RECIPIENT_OPTIONS = [
  { value: 'hs_hod', label: 'HS HOD' },
  { value: 'csm_hod', label: 'CSM HOD' },
  { value: 'cse_hod', label: 'CSE HOD' },
  { value: 'csd_hod', label: 'CSD HOD' },
  { value: 'ece_hod', label: 'ECE HOD' },
  { value: 'dean', label: 'Dean' },
  { value: 'tpo', label: 'TPO' },
  { value: 'director', label: 'Director' },
];

const DEPARTMENTS = ['HS', 'CSE', 'CSM', 'CSD', 'ECE'];

// HOD to Department mapping
const HOD_TO_DEPARTMENT_MAP: Record<string, string> = {
  'hs_hod': 'HS',
  'cse_hod': 'CSE',
  'csm_hod': 'CSM',
  'csd_hod': 'CSD',
  'ece_hod': 'ECE',
};

export function LetterDraftForm({ collection, profile, college }: LetterDraftFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Letter Content
  const [letterContent, setLetterContent] = useState<LetterContent>({
    recipients: [],
    subject: '',
    body: '',
  });

  // Step 2: Club Members by Department
  const [clubMembers, setClubMembers] = useState<ClubMembersByDept>({
    HS: [''],
    CSE: [''],
    CSM: [''],
    CSD: [''],
    ECE: [''],
  });

  const addRecipient = (recipient: string) => {
    if (!letterContent.recipients.includes(recipient)) {
      setLetterContent(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipient]
      }));
    }
  };

  const removeRecipient = (recipient: string) => {
    setLetterContent(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const addRollNumberField = (dept: keyof ClubMembersByDept) => {
    setClubMembers(prev => ({
      ...prev,
      [dept]: [...prev[dept], '']
    }));
  };

  const removeRollNumberField = (dept: keyof ClubMembersByDept, index: number) => {
    setClubMembers(prev => ({
      ...prev,
      [dept]: prev[dept].filter((_, i) => i !== index)
    }));
  };

  const updateRollNumber = (dept: keyof ClubMembersByDept, index: number, value: string) => {
    setClubMembers(prev => ({
      ...prev,
      [dept]: prev[dept].map((roll, i) => i === index ? value : roll)
    }));
  };

  // Helper function to get HOD recipients from selected recipients
  const getSelectedHODs = (): string[] => {
    return letterContent.recipients.filter(recipient => recipient.endsWith('_hod'));
  };

  // Helper function to get departments based on selected HOD recipients
  const getRelevantDepartments = (): string[] => {
    const selectedHODs = getSelectedHODs();
    const departments = selectedHODs
      .map(hod => HOD_TO_DEPARTMENT_MAP[hod])
      .filter(dept => dept !== undefined);
    
    return [...new Set(departments)]; // Remove duplicates
  };

  // Helper function to initialize club members for relevant departments only
  const initializeClubMembersForDepartments = (departments: string[]): ClubMembersByDept => {
    const initialState: ClubMembersByDept = {
      HS: [],
      CSE: [],
      CSM: [],
      CSD: [],
      ECE: [],
    };

    departments.forEach(dept => {
      if (dept in initialState) {
        initialState[dept as keyof ClubMembersByDept] = [''];
      }
    });

    return initialState;
  };

  // Helper function to get department names for user feedback
  const getDepartmentDisplayText = (): string => {
    const relevantDepartments = getRelevantDepartments();
    if (relevantDepartments.length === 0) {
      return 'No department-specific member details required';
    }
    return `Required departments: ${relevantDepartments.join(', ')}`;
  };

  const validateStep1 = () => {
    if (letterContent.recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return false;
    }
    
    // Validate that selected recipients exist in the options
    const validRecipients = RECIPIENT_OPTIONS.map(option => option.value);
    const invalidRecipients = letterContent.recipients.filter(recipient => 
      !validRecipients.includes(recipient)
    );
    
    if (invalidRecipients.length > 0) {
      toast.error(`Invalid recipients selected: ${invalidRecipients.join(', ')}`);
      return false;
    }
    
    if (!letterContent.subject.trim()) {
      toast.error('Please enter a subject');
      return false;
    }
    if (!letterContent.body.trim()) {
      toast.error('Please enter the letter body');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const relevantDepartments = getRelevantDepartments();
    
    // If no HOD recipients selected, validation passes (no department fields needed)
    if (relevantDepartments.length === 0) {
      return true;
    }
    
    // Check if at least one member is added in the relevant departments
    const hasMembers = relevantDepartments.some((dept) => {
      const deptMembers = clubMembers[dept as keyof ClubMembersByDept];
      return deptMembers && deptMembers.some((roll: string) => roll.trim() !== '');
    });
    
    if (!hasMembers) {
      toast.error('Please add at least one club member for the selected departments');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      // Reinitialize club members based on selected HOD recipients
      const relevantDepartments = getRelevantDepartments();
      const newClubMembers = initializeClubMembersForDepartments(relevantDepartments);
      setClubMembers(newClubMembers);
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      // Get relevant departments based on selected HOD recipients
      const relevantDepartments = getRelevantDepartments();
      
      // Clean up club members data - only include relevant departments and remove empty entries
      const cleanedClubMembers: Record<string, string[]> = {};
      relevantDepartments.forEach((dept) => {
        const deptRolls = clubMembers[dept as keyof ClubMembersByDept];
        if (deptRolls) {
          const cleanedRolls = deptRolls.filter((roll: string) => roll.trim() !== '');
          if (cleanedRolls.length > 0) {
            cleanedClubMembers[dept] = cleanedRolls;
          }
        }
      });

      const letterData = {
        collection_id: collection.id,
        recipients: letterContent.recipients,
        subject: letterContent.subject.trim(),
        body: letterContent.body.trim(),
        club_members_by_dept: cleanedClubMembers,
        closing: `Your sincerely - ${profile.club_name}`,
      };

      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(letterData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create letter');
      }

      toast.success('Letter drafted successfully!');
      router.push(`/${college}/collections/${encodeURIComponent(collection.name)}`);
    } catch (error: any) {
      console.error('Error creating letter:', error);
      toast.error(error.message || 'Failed to create letter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecipientLabel = (value: string) => {
    return RECIPIENT_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-green-600'}`}>
            Step 1: Letter Content
          </span>
          <span className={`text-sm font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
            Step 2: Club Members
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Letter Content</h2>
          
          {/* Recipients */}
          <div>
            <Label htmlFor="recipients" className="text-base font-medium">
              To Address <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Select officials to send this letter to</p>
            
            <Select onValueChange={addRecipient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipients..." />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENT_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={letterContent.recipients.includes(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {letterContent.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {letterContent.recipients.map((recipient) => (
                  <Badge key={recipient} variant="secondary" className="px-3 py-1">
                    {getRecipientLabel(recipient)}
                    <button
                      onClick={() => removeRecipient(recipient)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject" className="text-base font-medium">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={letterContent.subject}
              onChange={(e) => setLetterContent(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter the subject of your letter"
              className="mt-2"
              maxLength={500}
            />
          </div>

          {/* Letter Body */}
          <div>
            <Label htmlFor="body" className="text-base font-medium">
              Letter Body <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              value={letterContent.body}
              onChange={(e) => setLetterContent(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write your letter content here..."
              className="mt-2 min-h-[200px]"
              rows={8}
            />
          </div>

          {/* Closing */}
          <div>
            <Label className="text-base font-medium">Closing</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-gray-700">Your sincerely - {profile.club_name}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Club Member Details</h2>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Add roll numbers of club members organized by department
            </p>
            <p className="text-sm text-blue-600 font-medium">
              {getDepartmentDisplayText()}
            </p>
          </div>

          {(() => {
            const relevantDepartments = getRelevantDepartments();
            
            if (relevantDepartments.length === 0) {
              return (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">No department fields needed</p>
                  <p className="text-sm text-gray-500">
                    You haven't selected any HOD recipients that require department-specific member details.
                  </p>
                </div>
              );
            }

            return relevantDepartments.map((dept) => (
              <div key={dept} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">{dept} Department</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRollNumberField(dept as keyof ClubMembersByDept)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {clubMembers[dept as keyof ClubMembersByDept].map((rollNumber, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={rollNumber}
                        onChange={(e) => updateRollNumber(dept as keyof ClubMembersByDept, index, e.target.value)}
                        placeholder={`Enter ${dept} roll number`}
                        className="flex-1"
                      />
                      {clubMembers[dept as keyof ClubMembersByDept].length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRollNumberField(dept as keyof ClubMembersByDept, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Letter'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
