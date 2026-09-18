import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useProjects = (spaceId: string | undefined) => {
  return useQuery({
    queryKey: ['projects', spaceId],
    queryFn: async () => {
      if (!spaceId) throw new Error('Space ID is required');
      const { data } = await api.get(`/spaces/${spaceId}/projects`);
      return data;
    },
    enabled: !!spaceId,
  });
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const { data } = await api.get(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
