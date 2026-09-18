import React from 'react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { Brain, Calendar, Trophy, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const QuizHistory = ({ projectId, onSelectQuiz }: { projectId: string, onSelectQuiz?: (quizId: string) => void }) => {
  const { data: quizzes, isLoading } = useQuizzes(projectId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
        <Brain className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No quizzes taken yet</h3>
        <p className="text-sm text-gray-500 mt-2">Generate your first quiz to start testing your knowledge.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz: any) => (
        <div 
          key={quiz.id}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
          onClick={() => onSelectQuiz && onSelectQuiz(quiz.id)}
        >
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-2">{quiz.title || 'Knowledge Check'}</h4>
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {new Date(quiz.created_at || quiz.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-semibold uppercase">
                {String(quiz.quiz_type || quiz.type || 'Quiz').replace('_', ' ')}
              </span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-semibold uppercase">
                {quiz.difficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {quiz.score !== undefined ? (
              <div className="text-center">
                <div className="flex items-center text-orange-500 font-bold text-xl">
                  <Trophy className="w-5 h-5 mr-1.5" />
                  {quiz.score}%
                </div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Score</span>
              </div>
            ) : (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">New</span>
            )}
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors text-gray-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
