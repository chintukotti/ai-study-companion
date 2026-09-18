import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    },
  });
};

export const useAdminAIUsage = () => {
  return useQuery({
    queryKey: ['adminAIUsage'],
    queryFn: async () => {
      const { data } = await api.get('/admin/ai-usage');
      return data;
    },
  });
};
