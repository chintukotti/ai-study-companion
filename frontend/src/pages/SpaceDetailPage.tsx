import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, BookOpen, Users, Settings, ArrowLeft, FolderOpen, Clock } from 'lucide-react';
import { useSpace, useCreateProject } from '@/hooks/useSpaces';
import { useProjects } from '@/hooks/useProjects';
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

export const SpaceDetailPage = () => {
  const { spaceId, id } = useParams<{ spaceId?: string; id?: string }>();
  const currentSpaceId = spaceId || id || '';

  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpace(currentSpaceId);
  const { data: projects, isLoading: isProjectsLoading } = useProjects(currentSpaceId);
  const createProject = useCreateProject(currentSpaceId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpaceId || !projectName.trim()) return;
    
    createProject.mutate(
      { name: projectName.trim(), description: projectDescription.trim() || undefined },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setProjectName('');
          setProjectDescription('');
        },
      }
    );
  };

  if (isSpaceLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="space-y-4 border-b pb-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (spaceError || !space) {
    return (
      <div className="container mx-auto p-6 max-w-7xl text-center py-16">
        <div className="max-w-md mx-auto bg-white border border-red-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Space Not Found</h2>
          <p className="text-gray-500 mb-6">The requested study space could not be found or you do not have permission to view it.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/spaces">Back to Spaces</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
          <Link to="/spaces">
            <ArrowLeft className="w-4 h-4 mr-2" /> All Spaces
          </Link>
        </Button>
      </div>

      {/* Space Header */}
      <div className="bg-white rounded-2xl p-8 mb-8 border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{space.name}</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {space.role || 'Member'}
              </span>
            </div>
            <p className="text-gray-600 mt-2 max-w-2xl">{space.description || 'No description provided.'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Create New Project Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Project</DialogTitle>
                  <DialogDescription>
                    A project organizes your study materials, PDFs, AI tutor chats, and quizzes.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4 pt-4">
                  {createProject.error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                      {(createProject.error as any)?.response?.data?.error || (createProject.error as any)?.message || 'Failed to create project. Please try again.'}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name" 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g., Data Structures, Exam Prep, Unit 1" 
                      required 
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="What topics or chapters will be in this project?" 
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={createProject.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={createProject.isPending || !projectName.trim()}
                    >
                      {createProject.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content - Projects List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              Projects
            </h2>
            <span className="text-sm text-gray-500">
              {projects?.length || 0} {projects?.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          
          {isProjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-gray-50/50">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects in this space yet</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Create a project to start uploading PDF study materials, chatting with the AI Tutor, and taking quizzes.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="mr-2 h-4 w-4" /> Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project: any) => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="block group"
                >
                  <div className="bg-white border rounded-xl p-5 h-full transition-all duration-200 hover:shadow-md hover:border-blue-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-1.5 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {project.documentCount ?? 0} documents
                      </span>
                      <span className="text-blue-600 group-hover:underline font-medium">
                        Open Workspace &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Space Members
            </h3>
            <div className="space-y-3">
              {space.members && space.members.length > 0 ? (
                space.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs">
                        {m.profiles?.full_name?.charAt(0).toUpperCase() || m.profiles?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs truncate max-w-[120px]">
                          {m.profiles?.full_name || m.profiles?.email || 'User'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {m.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">1 member (Owner)</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl border border-blue-100 p-5">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">How it works</h4>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li><strong>Create a Project:</strong> Organizes a course or subject.</li>
              <li><strong>Upload Documents:</strong> Drop your PDFs in the project workspace.</li>
              <li><strong>Chat with Tutor:</strong> Ask questions grounded in your uploaded text with page citations.</li>
              <li><strong>Take Quizzes:</strong> Adaptive MCQs and open-ended questions.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
