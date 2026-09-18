import React, { useState } from 'react';
import { useGenerateQuiz } from '@/hooks/useQuizzes';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export const QuizGenerator = ({ projectId, onQuizGenerated }: { projectId: string, onQuizGenerated?: (quizId: string) => void }) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [count, setCount] = useState(5);
  
  const generateQuiz = useGenerateQuiz(projectId);

  const handleGenerate = () => {
    generateQuiz.mutate({
      topic: topic.trim() || undefined,
      type,
      difficulty,
      questionCount: count
    }, {
      onSuccess: (data: any) => {
        if (onQuizGenerated && data.id) {
          onQuizGenerated(data.id);
        }
      }
    });
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Generate a New Quiz</h2>
      </div>

      {generateQuiz.isError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
          {(generateQuiz.error as any)?.response?.data?.error || (generateQuiz.error as any)?.message || 'Failed to generate quiz. Please try again.'}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic (Optional)</label>
          <input 
            type="text" 
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Leave empty to quiz on the uploaded documents"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mcq">Multiple Choice</option>
              <option value="open_ended">Open Ended</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select 
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
            <select 
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={8}>8 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 flex items-center justify-center"
            onClick={handleGenerate}
            disabled={generateQuiz.isPending}
          >
            {generateQuiz.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating questions...
              </span>
            ) : (
              <span className="flex items-center font-semibold">
                <Sparkles className="w-5 h-5 mr-2" /> Generate Quiz
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
