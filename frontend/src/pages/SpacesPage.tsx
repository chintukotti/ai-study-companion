import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, FolderOpen } from 'lucide-react';
import { useSpaces, useCreateSpace } from '@/hooks/useSpaces';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const SpacesPage = () => {
  const { data: spaces, isLoading, error } = useSpaces();
  const createSpace = useCreateSpace();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    createSpace.mutate(
      { name: newSpaceName, description: newSpaceDescription },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNewSpaceName('');
          setNewSpaceDescription('');
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Spaces</h1>
          <p className="text-gray-500 mt-2">Manage your study environments and teams</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Space</DialogTitle>
              <DialogDescription>
                A space helps you organize projects and collaborate with others.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSpace} className="space-y-4 pt-4">
              {createSpace.error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {(createSpace.error as any)?.response?.data?.error || (createSpace.error as any)?.response?.data?.message || (createSpace.error as any)?.message || 'Failed to create space. Please try again.'}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Space Name</Label>
                <Input 
                  id="name" 
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g., Computer Science, Biology, Research" 
                  required 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  placeholder="What is this space for?" 
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createSpace.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={createSpace.isPending || !newSpaceName.trim()}
                >
                  {createSpace.isPending ? 'Creating...' : 'Create Space'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          Failed to load spaces. Please try again later.
        </div>
      )}

      {!isLoading && !error && spaces?.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No spaces yet</h3>
          <p className="text-gray-500 mb-6">Create your first space to get started</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-500 hover:bg-blue-600">
            Create Your First Space
          </Button>
        </div>
      )}

      {!isLoading && !error && spaces && spaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space: any) => (
            <Link 
              key={space.id} 
              to={`/spaces/${space.id}`}
              className="block group"
            >
              <div className="bg-white border rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-blue-200 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {space.name}
                </h3>
                <p className="text-gray-600 text-sm flex-grow mb-6 line-clamp-2">
                  {space.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span>{space.memberCount || 1} Members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    <span>{space.projectCount || 0} Projects</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
