import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useDocuments = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/documents`);
      return data;
    },
    enabled: !!projectId,
    refetchInterval: (query) => {
      const docs = query.state.data as Array<{ status: string }> | undefined;
      const isBusy = docs?.some((d) => d.status === 'processing' || d.status === 'uploading');
      return isBusy ? 3000 : false;
    },
  });
};

export const useUploadDocument = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post(`/projects/${projectId}/documents`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
    },
  });
};

export const useDocumentStatus = (docId: string | undefined) => {
  return useQuery({
    queryKey: ['documentStatus', docId],
    queryFn: async () => {
      if (!docId) throw new Error('Document ID is required');
      const { data } = await api.get(`/documents/${docId}/status`);
      return data;
    },
    enabled: !!docId,
    refetchInterval: (query) => {
      const data = query.state.data as { status: string } | undefined;
      return data?.status === 'processing' ? 3000 : false;
    },
  });
};

export const useDeleteDocument = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await api.delete(`/documents/${documentId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
    },
  });
};

