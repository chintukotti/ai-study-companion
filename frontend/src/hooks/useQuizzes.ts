import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useQuizzes = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['quizzes', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/quizzes`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useQuiz = (id: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      if (!id) throw new Error('Quiz ID is required');
      const { data } = await api.get(`/quizzes/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useGenerateQuiz = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { topic?: string; type?: string; difficulty?: string; questionCount?: number }) => {
      const { data } = await api.post(`/projects/${projectId}/quizzes/generate`, params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
    },
  });
};

export const useQuizResults = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: async () => {
      if (!quizId) throw new Error('Quiz ID is required');
      const { data } = await api.get(`/quizzes/${quizId}/results`);
      return data;
    },
    enabled: !!quizId,
  });
};

export const useSubmitQuiz = (quizId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: any) => {
      const payload = Array.isArray(answers) ? { answers } : { answers };
      const { data } = await api.post(`/quizzes/${quizId}/submit`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-results', quizId] });
      queryClient.invalidateQueries({ queryKey: ['mastery'] });
      queryClient.invalidateQueries({ queryKey: ['growth'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
    },
  });
};

