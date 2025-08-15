"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Calendar, 
  Filter, 
  ChevronDown,
  Mail,
  Users,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  letter_count: number;
  created_at: string;
  letters: any[];
}

interface CollectionsListProps {
  clubId: string;
  college: string;
  collections: Collection[];
}

export function CollectionsList({ clubId, college, collections: initialCollections }: CollectionsListProps) {
  const [collections, setCollections] = useState(initialCollections);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const sortOptions = [
    { value: 'recent', label: 'Latest to Oldest' },
    { value: 'oldest', label: 'Oldest to Latest' },
    { value: 'year', label: 'Sort by Year' },
    { value: 'month', label: 'Sort by Month' }
  ];

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        college,
        sortBy
      });

      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);

      const response = await fetch(`/api/clubs/${encodeURIComponent(clubId)}/collections?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sortBy !== 'recent' || filterMonth || filterYear) {
      fetchCollections();
    } else {
      setCollections(initialCollections);
    }
  }, [sortBy, filterMonth, filterYear]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getApprovalStatus = (letters: any[]) => {
    if (!letters || !Array.isArray(letters) || letters.length === 0) {
      return { approved: 0, pending: 0, rejected: 0 };
    }
    
    return letters.reduce((acc, letter) => {
      const status = letter.approval_status || {};
      const statuses = Object.values(status);
      
      statuses.forEach((s: any) => {
        if (s === 'approved') acc.approved++;
        else if (s === 'rejected') acc.rejected++;
        else acc.pending++;
      });
      
      return acc;
    }, { approved: 0, pending: 0, rejected: 0 });
  };

  const getStatusColor = (approved: number, pending: number, rejected: number) => {
    if (rejected > 0) return 'text-red-600';
    if (pending > 0) return 'text-yellow-600';
    if (approved > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  // Generate year and month options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h3 className="text-lg font-semibold">Collections</h3>
          <p className="text-sm text-muted-foreground">
            {collections.length} collections with {collections.reduce((sum, col) => sum + col.letter_count, 0)} total letters
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Year Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                {filterYear || 'All Years'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterYear('')}>
                All Years
              </DropdownMenuItem>
              {years.map((year) => (
                <DropdownMenuItem
                  key={year}
                  onClick={() => setFilterYear(year.toString())}
                >
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Month Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {filterMonth ? months.find(m => m.value === filterMonth)?.label : 'All Months'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterMonth('')}>
                All Months
              </DropdownMenuItem>
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.value}
                  onClick={() => setFilterMonth(month.value)}
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOptions.find(opt => opt.value === sortBy)?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections found</h3>
            <p className="text-gray-500">
              {filterMonth || filterYear || sortBy !== 'recent'
                ? 'Try adjusting your filter criteria.'
                : 'This club hasn\'t created any collections yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const approvalStats = getApprovalStatus(collection.letters);
            const statusColor = getStatusColor(
              approvalStats.approved,
              approvalStats.pending,
              approvalStats.rejected
            );

            return (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {collection.name}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {collection.letter_count} letters
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(collection.created_at)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Letters</span>
                    </div>
                    <span className="font-medium">{collection.letter_count}</span>
                  </div>

                  {collection.letter_count > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Approval Status</div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {approvalStats.approved} Approved
                        </div>
                        <div className="flex items-center text-yellow-600">
                          <Clock className="mr-1 h-3 w-3" />
                          {approvalStats.pending} Pending
                        </div>
                        <div className="flex items-center text-red-600">
                          <XCircle className="mr-1 h-3 w-3" />
                          {approvalStats.rejected} Rejected
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
