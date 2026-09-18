import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSendMessage, useChatSessions, useChatMessages, useRenameChatSession, useDeleteChatSession } from '@/hooks/useTutor';
import { MessageBubble } from './MessageBubble';
import { BookOpen, Send, Plus, AlertCircle, Pencil, Trash2, Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ChatInterface = ({ projectId }: { projectId: string }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showSessionsMobile, setShowSessionsMobile] = useState(false);
  
  // Chat session management states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading: isLoadingSessions } = useChatSessions(projectId);
  const { data: messages, isLoading: isLoadingMessages } = useChatMessages(
    currentSessionId && currentSessionId !== 'new' ? currentSessionId : undefined
  );
  const sendMessage = useSendMessage(projectId);
  const renameSession = useRenameChatSession(projectId);
  const deleteSession = useDeleteChatSession(projectId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingMessage, sendMessage.isPending]);

  // Set default session if exists
  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // Read prompt from URL query param if present
  useEffect(() => {
    const promptParam = searchParams.get('q');
    if (promptParam) {
      setInput(promptParam);
      // Clean query parameter from URL so it doesn't re-trigger on reload
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    setPendingMessage(text);
    setInput('');

    sendMessage.mutate(
      {
        sessionId: currentSessionId === 'new' ? undefined : currentSessionId || undefined,
        message: text,
      },
      {
        onSuccess: (data: any) => {
          if (data?.sessionId) {
            setCurrentSessionId(data.sessionId);
          }
          setPendingMessage(null);
        },
        onError: () => {
          // Keep pendingMessage so user sees what failed
        },
      }
    );
  };

  const handleStartNewChat = () => {
    setCurrentSessionId('new');
    setPendingMessage(null);
  };

  const handleStartRename = (session: any) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title || '');
    setDeletingSessionId(null);
  };

  const handleSaveRename = (sessionId: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingSessionId(null);
      return;
    }
    renameSession.mutate(
      { sessionId, title: trimmed },
      {
        onSettled: () => {
          setEditingSessionId(null);
        }
      }
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        setDeletingSessionId(null);
        if (currentSessionId === sessionId) {
          const remaining = (sessions || []).filter((s: any) => s.id !== sessionId);
          if (remaining.length > 0) {
            setCurrentSessionId(remaining[0].id);
          } else {
            setCurrentSessionId('new');
          }
          setPendingMessage(null);
        }
      },
      onError: () => {
        setDeletingSessionId(null);
      }
    });
  };

  const allMessages = messages || [];
  const hasMessages = allMessages.length > 0 || pendingMessage !== null;

  return (
    <div className="relative flex h-[580px] sm:h-[640px] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Sessions Sidebar */}
      <div 
        className={`border-r border-gray-200 bg-gray-50 flex flex-col p-3 sm:p-4 transition-all duration-200 ${
          showSessionsMobile 
            ? 'absolute inset-0 z-20 w-full bg-white md:relative md:w-64 md:bg-gray-50' 
            : 'hidden md:flex md:w-64'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <Button 
            variant="outline" 
            className="flex-1 justify-start text-blue-600 border-blue-200 hover:bg-blue-50 bg-white font-medium text-xs h-9"
            onClick={() => {
              handleStartNewChat();
              setShowSessionsMobile(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>

          {showSessionsMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-gray-500"
              onClick={() => setShowSessionsMobile(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {isLoadingSessions ? (
            <div className="text-xs text-gray-400 p-2">Loading chats...</div>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session: any) => {
              const isSelected = currentSessionId === session.id;
              const isEditing = editingSessionId === session.id;
              const isDeleting = deletingSessionId === session.id;

              if (isEditing) {
                return (
                  <div key={session.id} className="p-1.5 bg-white border border-blue-400 rounded-lg shadow-xs space-y-1.5">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.id);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      autoFocus
                      className="w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-800"
                    />
                    <div className="flex items-center justify-end gap-1.5 px-0.5">
                      <button
                        onClick={() => handleSaveRename(session.id)}
                        disabled={renameSession.isPending}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Save rename"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              if (isDeleting) {
                return (
                  <div key={session.id} className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1.5">
                    <p className="font-semibold text-red-800">Delete chat?</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deleteSession.isPending}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium"
                      >
                        {deleteSession.isPending ? '...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeletingSessionId(null)}
                        className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[11px] font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setPendingMessage(null);
                    setShowSessionsMobile(false);
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-900 font-semibold shadow-2xs'
                      : 'hover:bg-gray-200/70 text-gray-700'
                  }`}
                  title={session.title}
                >
                  <div className="flex items-center min-w-0 flex-1 mr-1">
                    <MessageSquare className={`w-3.5 h-3.5 mr-2 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate">{session.title || 'Chat Session'}</span>
                  </div>

                  {/* Actions: Rename & Delete */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(session);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white/80 rounded transition-colors"
                      title="Rename chat"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSessionId(session.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-white/80 rounded transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-400 p-2">No past sessions</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Mobile Header with History Drawer Toggle */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b bg-gray-50/70">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-gray-800 truncate">
              {currentSessionId === 'new' 
                ? 'New Conversation' 
                : sessions?.find((s: any) => s.id === currentSessionId)?.title || 'AI Tutor Chat'}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 shrink-0 bg-white"
            onClick={() => setShowSessionsMobile(!showSessionsMobile)}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            Chats ({sessions?.length || 0})
          </Button>
        </div>
        {isLoadingMessages && !hasMessages ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading messages...
          </div>
        ) : !hasMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Ask your AI Study Tutor anything!</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Answers are grounded in your uploaded project documents and include verifiable page citations.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
              {[
                'Summarize the key concepts',
                'What are the main definitions?',
                'Explain the core formulas or steps',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {allMessages.map((msg: any, idx: number) => (
              <MessageBubble key={msg.id || idx} message={msg} />
            ))}

            {/* Optimistic pending user message */}
            {pendingMessage && (
              <MessageBubble
                message={{
                  role: 'user',
                  content: pendingMessage,
                }}
              />
            )}

            {/* Generating typing animation */}
            {sendMessage.isPending && (
              <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-100 text-blue-800 px-4 py-3 rounded-2xl rounded-tl-sm w-fit shadow-xs">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs font-medium text-blue-700">AI Tutor is thinking and generating answer...</span>
              </div>
            )}

            {/* Error banner if request failed */}
            {sendMessage.isError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to generate reply</p>
                  <p className="mt-0.5 text-red-600">
                    {(sendMessage.error as any)?.response?.data?.message || (sendMessage.error as any)?.message || 'Something went wrong. Please check your document upload or try again.'}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setPendingMessage(null)}
                  className="text-red-700 hover:text-red-900 hover:bg-red-100 text-xs h-7 px-2"
                >
                  Dismiss
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative flex items-center">
            <textarea
              className="w-full resize-none rounded-xl border border-gray-300 pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[52px] max-h-[140px]"
              placeholder="Ask a question about your study materials..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <Button 
              size="icon"
              onClick={handleSend}
              disabled={sendMessage.isPending || !input.trim()}
              className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">
            Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">Shift + Enter</kbd> for a new line.
          </p>
        </div>
      </div>
    </div>
  );
};
