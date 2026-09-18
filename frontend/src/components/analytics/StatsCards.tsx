import React from 'react';
import { useProjectAnalytics } from '@/hooks/useAnalytics';
import { FileText, MessageSquare, Brain, Trophy, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const StatsCards = ({ projectId }: { projectId: string }) => {
  const { data: stats, isLoading } = useProjectAnalytics(projectId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const cards = [
    { label: 'Documents', value: stats?.documentCount ?? stats?.totalDocuments ?? 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Chat Sessions', value: stats?.chatSessionCount ?? 0, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Quizzes Taken', value: stats?.quizCount ?? stats?.quizAttempts ?? stats?.totalQuizzes ?? 0, icon: Brain, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Avg Score', value: `${stats?.averageScore ?? stats?.averageQuizScore ?? stats?.avgScore ?? 0}%`, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Overall Mastery', value: `${stats?.overallMastery ?? 0}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className={`p-3 rounded-xl ${card.bg} ${card.color} mb-3`}>
            <card.icon className="w-6 h-6" />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h4>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
        </div>
      ))}
    </div>
  );
};
