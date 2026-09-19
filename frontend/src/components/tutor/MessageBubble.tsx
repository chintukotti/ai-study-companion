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
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              Sources:
            </span>
            {message.citations.map((cite: any, i: number) => {
              const pageNum = cite.page ?? cite.page_number;
              const quoteText = cite.text || cite.quote;
              const docName = cite.document_title || cite.documentTitle || cite.doc_title || 'Document.pdf';
              return (
                <div 
                  key={i} 
                  className="group relative flex items-center bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-lg border border-blue-200/80 cursor-help hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800 mr-1 max-w-[170px] truncate" title={docName}>
                    {docName}
                  </span>
                  <span className="text-blue-600 font-semibold shrink-0">p. {pageNum}</span>
                  
                  {/* Tooltip */}
                  {quoteText && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-80 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-20 pointer-events-none leading-relaxed border border-slate-700">
                      <p className="font-bold text-blue-300 mb-1 border-b border-slate-800 pb-1 flex items-center justify-between">
                        <span className="truncate mr-2">{docName}</span>
                        <span className="text-blue-400 shrink-0">Page {pageNum}</span>
                      </p>
                      <p className="italic text-slate-300 text-[11px]">"{quoteText}"</p>
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
