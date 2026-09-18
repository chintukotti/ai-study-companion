import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useProjectAnalytics = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['projectAnalytics', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${projectId}/analytics`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useGlobalAnalytics = () => {
  return useQuery({
    queryKey: ['globalAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/global');
      return data;
    },
  });
};

export const useActivityTimeline = (params: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['activityTimeline', params],
    queryFn: async () => {
      const { data } = await api.get('/analytics/activity', { params });
      return data;
    },
  });
};
