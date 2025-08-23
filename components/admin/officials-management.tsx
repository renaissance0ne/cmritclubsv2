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
import { Plus, Search, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { Official, VALID_DEPARTMENTS, VALID_HOD_ROLES, VALID_GENERAL_ROLES, DEPARTMENT_NAMES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function OfficialsManagement() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    dept: '',
    official_role: '',
    college: 'cmrit'
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      const response = await fetch('/api/officials');
      if (response.ok) {
        const data = await response.json();
        setOfficials(data.officials || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch officials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching officials:', error);
      toast({
        title: "Error",
        description: "Failed to fetch officials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/officials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Official added and invitation sent successfully",
        });
        setIsAddDialogOpen(false);
        setFormData({
          display_name: '',
          email: '',
          dept: '',
          official_role: '',
          college: 'cmrit'
        });
        fetchOfficials();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add official",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding official:', error);
      toast({
        title: "Error",
        description: "Failed to add official",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOfficial = async () => {
    if (!selectedOfficial) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/officials?id=${selectedOfficial.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Official deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedOfficial(null);
        fetchOfficials();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete official",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting official:', error);
      toast({
        title: "Error",
        description: "Failed to delete official",
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

  const formatRole = (role: string) => {
    if (role.includes('_hod')) {
      return role.replace('_hod', '').toUpperCase() + ' HOD';
    }
    return role.toUpperCase();
  };

  const filteredOfficials = officials.filter(official =>
    official.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.official_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allRoles = [...VALID_HOD_ROLES, ...VALID_GENERAL_ROLES];

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
          <h1 className="text-2xl font-bold text-gray-900">Officials Management</h1>
          <p className="text-gray-600">Manage college officials and administrators</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Official
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Official</DialogTitle>
              <DialogDescription>
                Create a new official account and send invitation email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOfficial}>
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
                  <Label htmlFor="official_role">Role</Label>
                  <Select
                    value={formData.official_role}
                    onValueChange={(value) => setFormData({ ...formData, official_role: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="dean">Dean</SelectItem>
                      <SelectItem value="tpo">TPO</SelectItem>
                      {VALID_HOD_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {formatRole(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.official_role.includes('_hod') && (
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
                )}
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
            placeholder="Search officials..."
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
            <CardTitle className="text-sm font-medium">Total Officials</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{officials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {officials.filter(o => o.clerk_id && o.status === 'approved').length}
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
              {officials.filter(o => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {officials.filter(o => o.official_role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Officials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Officials List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOfficials.map((official) => (
                <TableRow key={official.id}>
                  <TableCell className="font-medium">{official.display_name}</TableCell>
                  <TableCell>{official.email}</TableCell>
                  <TableCell>{formatRole(official.official_role)}</TableCell>
                  <TableCell>
                    {official.dept ? DEPARTMENT_NAMES[official.dept as keyof typeof DEPARTMENT_NAMES] : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(official.status, official.clerk_id)}</TableCell>
                  <TableCell>{new Date(official.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOfficial(official);
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
          {filteredOfficials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No officials found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Official</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOfficial?.display_name}? This action cannot be undone.
              This will remove the official from both the system and Clerk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOfficial} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
