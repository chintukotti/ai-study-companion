import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useSpaces = () => {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data } = await api.get('/spaces');
      return data;
    },
  });
};

export const useSpace = (id: string | undefined) => {
  return useQuery({
    queryKey: ['spaces', id],
    queryFn: async () => {
      if (!id) throw new Error('Space ID is required');
      const { data } = await api.get(`/spaces/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSpace: { name: string; description?: string }) => {
      const { data } = await api.post('/spaces', newSpace);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
    },
  });
};

export const useCreateProject = (spaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProject: { name: string; description?: string }) => {
      const { data } = await api.post(`/spaces/${spaceId}/projects`, newProject);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['globalAnalytics'] });
    },
  });
};
