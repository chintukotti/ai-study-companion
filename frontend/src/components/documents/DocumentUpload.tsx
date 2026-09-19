import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocuments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const DocumentUpload = ({ projectId, onUploadComplete }: { projectId: string, onUploadComplete?: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uploadDoc = useUploadDocument(projectId);
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  }, [projectId]);

  const handleChange = function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB.');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    uploadDoc.mutate(formData, {
      onSuccess: () => {
        if (onUploadComplete) onUploadComplete();
      },
      onError: (err: any) => {
        const serverMsg = err.response?.data?.error || err.response?.data?.message;
        if (serverMsg) {
          setError(serverMsg);
        } else if (err.message?.includes('aborted') || err.message?.includes('Network Error')) {
          setError('Upload connection was interrupted or server is waking up. Please try again.');
        } else if (err.response?.status === 404) {
          setError('Upload endpoint not found. Please refresh and try again.');
        } else {
          setError(err.message || 'An error occurred during upload.');
        }
      }
    });
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">Click or drag PDF files here</p>
        <p className="text-xs text-gray-500 mt-1">Maximum file size 25MB</p>
        <input 
          id="file-upload" 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          onChange={handleChange} 
        />
      </div>
      
      {uploadDoc.isPending && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-2.5 rounded-full" style={{ width: '50%' }}></div>
          <p className="text-xs text-gray-500 mt-2 text-center">Uploading...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
