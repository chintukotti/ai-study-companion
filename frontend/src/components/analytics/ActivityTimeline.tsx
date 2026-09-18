import React, { useState } from 'react';
import { useActivityTimeline } from '@/hooks/useAnalytics';
import { Upload, MessageSquare, Brain, FileText, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const ActivityTimeline = ({ projectId }: { projectId?: string }) => {
  const [page, setPage] = useState(1);
  const { data: timelineData, isLoading } = useActivityTimeline({ projectId, page });

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6 px-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const events = Array.isArray(timelineData) 
    ? timelineData 
    : (timelineData?.events || []);

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No activity yet
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4 text-blue-600" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'quiz': return <Brain className="w-4 h-4 text-orange-600" />;
      case 'completion': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-blue-100 border-blue-200';
      case 'chat': return 'bg-purple-100 border-purple-200';
      case 'quiz': return 'bg-orange-100 border-orange-200';
      case 'completion': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="px-4">
      <div className="relative border-l-2 border-gray-100 ml-5 space-y-8 pb-8">
        {events.map((event: any, idx: number) => {
          const rawDate = event.timestamp || event.created_at || new Date().toISOString();
          let timeAgo = 'recently';
          try {
            timeAgo = formatDistanceToNow(new Date(rawDate), { addSuffix: true });
          } catch {}

          const evType = event.type || event.event_type || 'activity';

          return (
            <div key={event.id || idx} className="relative pl-8">
              <div className={`absolute -left-5 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${getEventBg(evType)}`}>
                {getEventIcon(evType)}
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  {event.description || String(event.event_type || 'Activity').replace(/_/g, ' ')}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {timelineData.hasMore && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="ghost" 
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
            onClick={() => setPage(p => p + 1)}
          >
            Load more activity
          </Button>
        </div>
      )}
    </div>
  );
};
