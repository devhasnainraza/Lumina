import { apiClient } from './client';
import type { AnalyticsDashboard } from '@/types/document';

export const analyticsApi = {
  getDashboard: async (period: '7d' | '30d' = '7d'): Promise<AnalyticsDashboard> => {
    const response = await apiClient.get('/api/analytics/dashboard', {
      params: { period },
    });
    const data = response.data;

    return {
      stats: {
        queryCount: data.stats.query_count !== undefined ? data.stats.query_count : data.stats.queryCount,
        documentCount: data.stats.document_count !== undefined ? data.stats.document_count : data.stats.documentCount,
        sessionCount: data.stats.session_count !== undefined ? data.stats.session_count : data.stats.sessionCount,
      },
      activityTimeline: data.activity_timeline || data.activityTimeline || [],
      documentTypes: data.document_types || data.documentTypes || { pdf: 0, docx: 0, txt: 0 },
      storageUsed: data.storage_used !== undefined ? data.storage_used : data.storageUsed,
    };
  },
};
