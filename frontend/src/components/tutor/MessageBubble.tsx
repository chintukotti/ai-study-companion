import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Citation {
  page: number;
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  is_unsupported?: boolean;
}

export const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[80%] flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {message.is_unsupported && !isUser && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800 p-3 mb-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
            <AlertDescription className="text-xs">
              This response may not be fully supported by your uploaded documents.
            </AlertDescription>
          </Alert>
        )}

        <div 
          className={`px-5 py-3.5 text-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm' 
              : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm'
          }`}
        >
          <MarkdownRenderer content={message.content} isUser={isUser} />
        </div>

        {message.citations && message.citations.length > 0 && !isUser && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.citations.map((cite: any, i: number) => {
              const pageNum = cite.page ?? cite.page_number;
              const quoteText = cite.text || cite.quote;
              return (
                <div 
                  key={i} 
                  className="group relative flex items-center bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200 cursor-help"
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-orange-500" />
                  Page {pageNum}
                  
                  {/* Tooltip */}
                  {quoteText && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-20 pointer-events-none">
                      "{quoteText}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
