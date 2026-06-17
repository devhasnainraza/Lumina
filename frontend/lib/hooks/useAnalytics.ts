'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

export function useAnalytics(period: '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await analyticsApi.getDashboard(period);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
