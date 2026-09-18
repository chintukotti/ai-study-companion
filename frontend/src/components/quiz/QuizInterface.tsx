import React, { useState } from 'react';
import { useQuiz, useSubmitQuiz, useQuizResults } from '@/hooks/useQuizzes';
import { Button } from '@/components/ui/button';
import { QuizResults } from './QuizResults';

export const QuizInterface = ({ quizId, onComplete }: { quizId: string, onComplete?: () => void }) => {
  const { data: quiz, isLoading, isError, error } = useQuiz(quizId);
  const { data: pastResults } = useQuizResults(quizId);
  const submitQuiz = useSubmitQuiz(quizId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading quiz...</div>;

  if (isError || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100 shadow-sm text-center max-w-xl mx-auto">
        <h3 className="text-lg font-bold text-red-600">Failed to Load Quiz</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          {(error as any)?.response?.data?.error || (error as any)?.message || 'Unable to retrieve quiz details.'}
        </p>
        {onComplete && (
          <Button onClick={onComplete} variant="outline">
            Back to Quizzes
          </Button>
        )}
      </div>
    );
  }

  const questions = quiz.quiz_questions || quiz.questions || [];

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-4 font-bold text-2xl">
          !
        </div>
        <h3 className="text-lg font-bold text-gray-800">No Questions in this Quiz</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          This quiz doesn't contain any questions yet. You can generate a fresh quiz from your study materials.
        </p>
        {onComplete && (
          <Button onClick={onComplete} variant="outline">
            Back to Quizzes
          </Button>
        )}
      </div>
    );
  }

  if (showResults && results) {
    return (
      <QuizResults 
        results={results} 
        onRetry={() => {
          setAnswers({});
          setCurrentIndex(0);
          setShowResults(false);
          setResults(null);
        }}
        onBack={onComplete}
      />
    );
  }

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => {
      const q = questions.find((item: any) => item.id === qId);
      const isMcq = q?.question_type === 'mcq' || q?.type === 'mcq' || q?.type === 'multiple_choice';
      let selectedOptionIndex = undefined;
      if (isMcq && Array.isArray(q?.options)) {
        const idx = q.options.indexOf(ans);
        if (idx !== -1) selectedOptionIndex = idx;
      }
      if (selectedOptionIndex === undefined && !isNaN(Number(ans))) {
        selectedOptionIndex = Number(ans);
      }
      return {
        questionId: qId,
        answer: ans,
        selectedOptionIndex
      };
    });

    submitQuiz.mutate(formattedAnswers, {
      onSuccess: (data: any) => {
        setResults(data);
        setShowResults(true);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
      {pastResults && Object.keys(answers).length === 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-blue-900 font-medium">
            You previously completed this quiz with score: <strong className="font-bold text-blue-700">{pastResults.score}%</strong>
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 h-7 font-semibold"
            onClick={() => {
              setResults(pastResults);
              setShowResults(true);
            }}
          >
            View Results
          </Button>
        </div>
      )}

      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-500">Question {currentIndex + 1} of {total}</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
            {question.blooms_level || question.bloomLevel || 'Knowledge'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-xl font-medium text-gray-900 mb-8">{question.question || question.text}</h3>

        {(question.question_type === 'mcq' || question.type === 'mcq' || question.type === 'multiple_choice') ? (
          <div className="space-y-3">
            {question.options?.map((opt: string, i: number) => {
              const letters = ['A', 'B', 'C', 'D'];
              const isSelected = answers[question.id] === opt;
              return (
                <div 
                  key={i}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: opt }))}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 font-bold text-sm ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {letters[i]}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <textarea 
              className="w-full flex-1 rounded-xl border-2 border-gray-200 p-4 focus:ring-0 focus:border-blue-500 outline-none resize-none min-h-[200px]"
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Previous
        </Button>
        
        {currentIndex === total - 1 ? (
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white" 
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < total || submitQuiz.isPending}
          >
            {submitQuiz.isPending ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNext}>
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
};
