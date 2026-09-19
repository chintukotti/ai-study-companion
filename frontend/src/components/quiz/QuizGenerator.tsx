import React, { useState } from 'react';
import { useGenerateQuiz } from '@/hooks/useQuizzes';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Upload, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const QuizGenerator = ({
  projectId,
  onQuizGenerated,
  onGoToDocuments,
}: {
  projectId: string;
  onQuizGenerated?: (quizId: string) => void;
  onGoToDocuments?: () => void;
}) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [count, setCount] = useState(5);

  const { data: documents, isLoading: isDocsLoading } = useDocuments(projectId);
  const generateQuiz = useGenerateQuiz(projectId);

  const readyDocs = (documents || []).filter((d: any) => d.status === 'ready');
  const isProcessing = (documents || []).some((d: any) => d.status === 'processing' || d.status === 'uploading');

  if (isDocsLoading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (readyDocs.length === 0) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
          {isProcessing ? <Clock className="w-7 h-7 animate-spin" /> : <FileText className="w-7 h-7" />}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isProcessing ? 'Study Materials Are Processing' : 'No PDF Uploaded'}
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          {isProcessing
            ? 'Your study PDF is currently being analyzed and chunked. Quizzes are generated strictly from your uploaded course materials and will be ready momentarily.'
            : 'Quizzes are generated strictly from your uploaded course materials to ensure 100% accurate, document-aligned questions. Please upload a PDF to generate quizzes.'}
        </p>
        {onGoToDocuments && (
          <Button
            onClick={onGoToDocuments}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Go to Documents Tab
          </Button>
        )}
      </div>
    );
  }

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
