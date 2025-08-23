"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Trash2, GraduationCap, Users } from 'lucide-react';
import { Mentor, VALID_DEPARTMENTS, DEPARTMENT_NAMES, STUDENT_YEARS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function MentorsManagement() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    dept: '',
    role: 'mentor',
    college: 'cmrit',
    year: undefined as number | undefined
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/mentors');
      if (response.ok) {
        const data = await response.json();
        setMentors(data.mentors || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch mentors",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/mentors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Mentor added and invitation sent successfully",
        });
        setIsAddDialogOpen(false);
        setFormData({
          display_name: '',
          email: '',
          dept: '',
          role: 'mentor',
          college: 'cmrit',
          year: undefined
        });
        fetchMentors();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add mentor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding mentor:', error);
      toast({
        title: "Error",
        description: "Failed to add mentor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMentor = async () => {
    if (!selectedMentor) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/mentors?id=${selectedMentor.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Mentor deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedMentor(null);
        fetchMentors();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete mentor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting mentor:', error);
      toast({
        title: "Error",
        description: "Failed to delete mentor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, clerkId?: string) => {
    if (clerkId && status === 'approved') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    
    switch (status) {
      case 'pending':
        if (clerkId === null) {
          return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Invited</Badge>;
        }
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentors Management</h1>
          <p className="text-gray-600">Manage student mentors and peer advisors</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Mentor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Mentor</DialogTitle>
              <DialogDescription>
                Create a new mentor account and send invitation email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMentor}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dept">Department</Label>
                  <Select
                    value={formData.dept}
                    onValueChange={(value) => setFormData({ ...formData, dept: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {DEPARTMENT_NAMES[dept]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Senior Mentor, Peer Advisor"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year (Optional)</Label>
                  <Select
                    value={formData.year?.toString() || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, year: value === 'none' ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {STUDENT_YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : '4th'} Year
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create & Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search mentors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentors.filter(m => m.clerk_id && m.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentors.filter(m => m.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Department</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(mentors.map(m => m.dept)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mentors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mentors List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMentors.map((mentor) => (
                <TableRow key={mentor.id}>
                  <TableCell className="font-medium">{mentor.display_name}</TableCell>
                  <TableCell>{mentor.email}</TableCell>
                  <TableCell>{DEPARTMENT_NAMES[mentor.dept as keyof typeof DEPARTMENT_NAMES]}</TableCell>
                  <TableCell>{mentor.role}</TableCell>
                  <TableCell>{mentor.year ? `${mentor.year}${mentor.year === 1 ? 'st' : mentor.year === 2 ? 'nd' : mentor.year === 3 ? 'rd' : 'th'} Year` : '-'}</TableCell>
                  <TableCell>{getStatusBadge(mentor.status, mentor.clerk_id)}</TableCell>
                  <TableCell>{new Date(mentor.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMentor(mentor);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMentors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No mentors found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mentor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMentor?.display_name}? This action cannot be undone.
              This will remove the mentor from both the system and Clerk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMentor} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
