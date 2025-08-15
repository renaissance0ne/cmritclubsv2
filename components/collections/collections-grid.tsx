"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, Trash2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  letter_count?: number;
}

interface CollectionsGridProps {
  collections: Collection[];
  college: string;
}

export function CollectionsGrid({ collections, college }: CollectionsGridProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (collectionId: string, collectionName: string) => {
    setDeletingId(collectionId);
    
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      toast.success(`Collection "${collectionName}" deleted successfully`);
      // Use Next.js router to refresh the page properly
      router.refresh();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    } finally {
      setDeletingId(null);
    }
  };

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first collection to start organizing your official letters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {collection.name}
                </h3>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={deletingId === collection.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the collection "{collection.name}"? 
                    This action cannot be undone and will also delete all letters in this collection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(collection.id, collection.name)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="w-4 h-4 mr-1" />
              <span>{collection.letter_count || 0} letters</span>
            </div>
            
            <Link href={`/${college}/collections/${encodeURIComponent(collection.name)}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Open
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
