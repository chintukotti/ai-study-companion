import React from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessingStatus } from './ProcessingStatus';

export const DocumentList = ({ projectId }: { projectId: string }) => {
  const { data: documents, isLoading, isError, error } = useDocuments(projectId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading documents: {(error as any)?.message}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
        <Upload className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No documents yet</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">Upload some study materials to start generating quizzes and getting AI help.</p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Uploading</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full animate-pulse">Processing</span>;
      case 'ready':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ready</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc: any) => (
        <div key={doc.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 truncate max-w-[150px]" title={doc.title}>{doc.title}</h4>
                <p className="text-xs text-gray-500">{formatSize(doc.file_size ?? doc.size ?? 0)}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
            {getStatusBadge(doc.status)}
            <span className="text-xs text-gray-500">
              {(doc.page_count ?? doc.pageCount) ? `${doc.page_count ?? doc.pageCount} pages • ` : ''}
              {new Date(doc.created_at || doc.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>

          {doc.status === 'processing' && (
            <div className="mt-3">
              <ProcessingStatus documentId={doc.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
