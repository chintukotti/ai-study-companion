import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useChatSessions = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['chatSessions', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/tutor/sessions`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useChatMessages = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data } = await api.get(`/tutor/sessions/${sessionId}/messages`);
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useSendMessage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageData: { message?: string; content?: string; sessionId?: string }) => {
      const payload = {
        message: messageData.message || messageData.content,
        sessionId: messageData.sessionId
      };
      const { data } = await api.post(`/projects/${projectId}/tutor/chat`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.sessionId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chatSessions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
    },
  });
};

export const useRenameChatSession = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const { data } = await api.patch(`/tutor/sessions/${sessionId}`, { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions', projectId] });
    },
  });
};

export const useDeleteChatSession = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete(`/tutor/sessions/${sessionId}`);
      return data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: ['chatMessages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chatSessions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
    },
  });
};
