import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useMastery = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['mastery', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/mastery`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useGrowth = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['growth', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/growth`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useRecommendations = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['recommendations', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/recommendations`);
      return data;
    },
    enabled: !!projectId,
  });
};
