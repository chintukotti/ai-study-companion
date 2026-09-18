import React from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const QuizResults = ({ results, onRetry, onBack }: { results: any, onRetry?: () => void, onBack?: () => void }) => {
  const score = Number(results?.score ?? 0);
  const answers = Array.isArray(results?.answers) ? results.answers : [];
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 mb-6">Here is how you did</p>
        
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-8 border-gray-50 shadow-inner">
          <span className={`text-5xl font-black ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">Detailed Feedback</h3>
        
        {answers.map((ans: any, idx: number) => {
          const qText = ans.questionText || ans.question_text || `Question ${idx + 1}`;
          const isCorrect = ans.isCorrect ?? ans.is_correct ?? false;
          const userAns = ans.userAnswer || ans.user_answer || 'No answer provided';
          const correctAns = ans.correctAnswer || ans.correct_answer || '';
          const isMcq = (ans.type === 'multiple_choice' || ans.question_type === 'mcq' || ans.type === 'mcq');
          const feedback = ans.feedback || ans.ai_evaluation?.feedback || ans.ai_evaluation?.explanation || ans.explanation || '';
          const strengths = ans.strengths || ans.ai_evaluation?.strengths || [];
          const misconceptions = ans.misconceptions || ans.ai_evaluation?.misconceptions || [];
          const scoreEarned = ans.pointsEarned ?? ans.score ?? (isCorrect ? 100 : 0);
          const scoreTotal = ans.pointsTotal ?? 100;

          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex gap-2">
                <span className="text-gray-400">Q{idx + 1}.</span> {qText}
              </h4>

              {isMcq ? (
                <div className="space-y-3 mt-4">
                  <div className={`p-3 rounded-lg flex items-start border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Your Answer</span>
                      <span className={isCorrect ? 'text-green-900 font-medium' : 'text-red-900 font-medium'}>{userAns}</span>
                    </div>
                  </div>
                  
                  {!isCorrect && correctAns && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Correct Answer</span>
                        <span className="text-gray-900 font-medium">{correctAns}</span>
                      </div>
                    </div>
                  )}

                  {feedback && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900">
                      <span className="font-bold block mb-1 text-blue-800">Explanation:</span>
                      {feedback}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Your Answer</span>
                    <p className="text-gray-800 text-sm">{userAns}</p>
                  </div>
                  
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-800">AI Evaluation</span>
                      <span className="text-sm font-bold bg-white px-2 py-1 rounded-md text-blue-600 shadow-sm">Score: {scoreEarned}/{scoreTotal}</span>
                    </div>
                    
                    {feedback && <p className="text-sm text-blue-900 mb-4">{feedback}</p>}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {strengths && strengths.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-green-700 mb-1 block">Strengths</span>
                          <ul className="list-disc pl-4 text-xs text-green-800 space-y-1">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {misconceptions && misconceptions.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-red-700 mb-1 block">Needs Work</span>
                          <ul className="list-disc pl-4 text-xs text-red-800 space-y-1">
                            {misconceptions.map((m: string, i: number) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center gap-4 pt-6">
        {onBack && (
          <Button 
            variant="outline" 
            className="rounded-full px-6 py-6 font-semibold"
            onClick={onBack}
          >
            Back to Quizzes
          </Button>
        )}
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 shadow-lg shadow-blue-200"
          onClick={onRetry}
        >
          <RefreshCw className="w-5 h-5 mr-2" /> Retake Quiz
        </Button>
      </div>
    </div>
  );
};
