'use client';

import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import type { DocumentStatus, DocumentListResponse } from '@/types/document';

export function useDocuments(params?: { status?: DocumentStatus }) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const response = await documentsApi.list(params);
      return response;
    },
    refetchInterval: (query) => {
      const data = query.state.data as DocumentListResponse | undefined;
      // Poll every 5 seconds if any documents are processing
      const hasProcessing = data?.documents.some(
        (doc) => doc.status === 'processing' || doc.status === 'uploaded'
      );
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const response = await documentsApi.getById(documentId);
      return response;
    },
    enabled: !!documentId,
  });
}

export function useDocumentChunks(documentId: string) {
  return useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: async () => {
      const response = await documentsApi.getChunks(documentId);
      return response;
    },
    enabled: !!documentId,
  });
}

