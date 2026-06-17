import { apiClient } from './client';
import type { Document, DocumentListResponse, DocumentDetail, Chunk } from '@/types/document';

export function mapDocument(doc: any): Document {
  if (!doc) return doc;
  return {
    id: doc.id,
    filename: doc.filename,
    fileSize: doc.file_size !== undefined ? doc.file_size : doc.fileSize,
    fileType: doc.file_type || doc.fileType,
    status: doc.status,
    createdAt: doc.created_at || doc.createdAt,
    processedAt: doc.processed_at || doc.processedAt,
    errorMessage: doc.error_message || doc.errorMessage,
  };
}

export function mapDocumentDetail(doc: any): DocumentDetail {
  if (!doc) return doc;
  return {
    ...mapDocument(doc),
    chunkCount: doc.chunk_count !== undefined ? doc.chunk_count : doc.chunkCount,
  };
}

export const documentsApi = {
  upload: async (file: File, onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/docs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return mapDocument(response.data);
  },

  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: 'uploaded' | 'processing' | 'completed' | 'failed';
  }): Promise<DocumentListResponse> => {
    const response = await apiClient.get('/api/docs', { params });
    const data = response.data;
    return {
      documents: data.documents?.map(mapDocument) || [],
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  },

  getById: async (documentId: string): Promise<DocumentDetail> => {
    const response = await apiClient.get(`/api/docs/${documentId}`);
    return mapDocumentDetail(response.data);
  },

  getChunks: async (documentId: string): Promise<Chunk[]> => {
    const response = await apiClient.get(`/api/docs/${documentId}/chunks`);
    return response.data;
  },

  viewFile: async (documentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/docs/${documentId}/view`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (documentId: string) => {
    const response = await apiClient.delete(`/api/docs/${documentId}`);
    return response.data;
  },

  rename: async (documentId: string, filename: string): Promise<Document> => {
    const response = await apiClient.patch(`/api/docs/${documentId}/rename`, { filename });
    return mapDocument(response.data);
  },
};
