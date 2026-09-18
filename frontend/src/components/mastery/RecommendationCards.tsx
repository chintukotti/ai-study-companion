import React from 'react';
import { useRecommendations } from '@/hooks/useMastery';
import { BookOpen, Brain, PenTool, Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

export const RecommendationCards = ({ projectId }: { projectId: string }) => {
  const { data: recommendations, isLoading, refetch } = useRecommendations(projectId);

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/recommendations/${id}/complete`);
      refetch();
    } catch (error) {
      console.error("Failed to complete recommendation", error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-blue-50 text-blue-700 p-6 rounded-xl text-center border border-blue-100">
        <Compass className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">Keep learning to get personalized recommendations!</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'read': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'review': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'practice': return <PenTool className="w-5 h-5 text-orange-500" />;
      case 'quiz': return <Sparkles className="w-5 h-5 text-yellow-500" />;
      default: return <Compass className="w-5 h-5 text-green-500" />;
    }
  };

  // Sort by priority (assuming higher number = higher priority)
  const sortedRecs = [...recommendations].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedRecs.map((rec: any) => (
        <div key={rec.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
              {getIcon(rec.type)}
            </div>
            {rec.priority && (
              <div className="flex space-x-1">
                {[...Array(Math.min(3, Math.ceil(rec.priority / 3)))].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                ))}
              </div>
            )}
          </div>
          
          <h4 className="font-bold text-gray-900 mb-2">{rec.title}</h4>
          <p className="text-sm text-gray-500 flex-1 mb-4">{rec.description}</p>
          
          <Button 
            variant="outline" 
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => handleComplete(rec.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete
          </Button>
        </div>
      ))}
    </div>
  );
};
