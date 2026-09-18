import React from 'react';
import { useDocumentStatus } from '@/hooks/useDocuments';

export const ProcessingStatus = ({ documentId }: { documentId: string }) => {
  const { data: statusData } = useDocumentStatus(documentId);

  if (!statusData) return null;

  let message = "Processing...";
  let progress = 0;

  switch (statusData.status) {
    case 'uploading':
      message = "Uploading...";
      progress = 20;
      break;
    case 'extracting':
      message = "Extracting text...";
      progress = 50;
      break;
    case 'embedding':
      message = "Generating embeddings...";
      progress = 80;
      break;
    case 'ready':
      message = "Ready!";
      progress = 100;
      break;
  }

  return (
    <div className="w-full space-y-2">
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500 font-medium">{message}</p>
    </div>
  );
};
