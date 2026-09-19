import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, MessageSquare, CheckCircle, BarChart2, TrendingUp } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Feature Components
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { ChatInterface } from '@/components/tutor/ChatInterface';
import { QuizGenerator } from '@/components/quiz/QuizGenerator';
import { QuizInterface } from '@/components/quiz/QuizInterface';
import { QuizHistory } from '@/components/quiz/QuizHistory';
import { ConceptMasteryChart } from '@/components/mastery/ConceptMasteryChart';
import { GrowthGraph } from '@/components/mastery/GrowthGraph';
import { RecommendationCards } from '@/components/mastery/RecommendationCards';
import { StatsCards } from '@/components/analytics/StatsCards';
import { ActivityTimeline } from '@/components/analytics/ActivityTimeline';

export const ProjectWorkspacePage = () => {
  const { projectId, id } = useParams<{ projectId?: string; id?: string }>();
  const currentProjectId = projectId || id || '';
  const location = useLocation();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(currentProjectId);
  const [activeTab, setActiveTab] = useState('documents');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Sync activeTab with URL sub-route
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const subRoute = segments[2];
    if (subRoute) {
      if (['documents', 'tutor', 'quizzes', 'quiz', 'mastery', 'analytics'].includes(subRoute)) {
        setActiveTab(subRoute === 'quiz' ? 'quizzes' : subRoute);
      }
    }
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    navigate(`/projects/${currentProjectId}/${val}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="flex-grow rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          Failed to load project workspace.
        </div>
      </div>
    );
  }

  const spaceId = project.space_id || project.spaceId || '';

  return (
    <div className="container mx-auto p-2 sm:p-6 max-w-7xl flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to={`/spaces/${spaceId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{project.description || 'Workspace'}</p>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-grow flex flex-col min-h-0 bg-gray-50/50 rounded-2xl border p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-5 bg-white border mb-3 sm:mb-4 rounded-lg p-1 gap-1 w-full shrink-0">
            <TabsTrigger value="documents" className="flex-1 min-w-[100px] sm:min-w-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-xs sm:text-sm">
              <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Documents
            </TabsTrigger>
            <TabsTrigger value="tutor" className="flex-1 min-w-[100px] sm:min-w-0 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 text-xs sm:text-sm">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> AI Tutor
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex-1 min-w-[100px] sm:min-w-0 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 text-xs sm:text-sm">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Quizzes
            </TabsTrigger>
            <TabsTrigger value="mastery" className="flex-1 min-w-[100px] sm:min-w-0 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Mastery
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-[100px] sm:min-w-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-xs sm:text-sm">
              <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-auto relative rounded-xl p-2">
            {/* Documents Tab */}
            <TabsContent value="documents" className="m-0 space-y-6">
              <DocumentUpload projectId={currentProjectId} />
              <DocumentList projectId={currentProjectId} />
            </TabsContent>
            
            {/* AI Tutor Tab */}
            <TabsContent value="tutor" className="m-0 h-full">
              <ChatInterface projectId={currentProjectId} />
            </TabsContent>
            
            {/* Quizzes Tab */}
            <TabsContent value="quizzes" className="m-0 space-y-6">
              {activeQuizId ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={() => setActiveQuizId(null)}>
                      Back to Quizzes
                    </Button>
                  </div>
                  <QuizInterface quizId={activeQuizId} onComplete={() => setActiveQuizId(null)} />
                </div>
              ) : (
                <div className="space-y-6">
                  <QuizGenerator
                    projectId={currentProjectId}
                    onQuizGenerated={(newQuizId) => setActiveQuizId(newQuizId)}
                    onGoToDocuments={() => handleTabChange('documents')}
                  />
                  <QuizHistory
                    projectId={currentProjectId}
                    onSelectQuiz={(selectedId) => setActiveQuizId(selectedId)}
                  />
                </div>
              )}
            </TabsContent>
            
            {/* Mastery & Growth Tab */}
            <TabsContent value="mastery" className="m-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConceptMasteryChart projectId={currentProjectId} />
                <GrowthGraph projectId={currentProjectId} />
              </div>
              <RecommendationCards projectId={currentProjectId} />
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics" className="m-0 space-y-6">
              <StatsCards projectId={currentProjectId} />
              <ActivityTimeline projectId={currentProjectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
