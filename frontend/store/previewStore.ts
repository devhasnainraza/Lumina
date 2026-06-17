import { create } from 'zustand';

interface PreviewState {
  isOpen: boolean;
  documentId: string | null;
  documentName: string | null;
  highlightChunkIndex: number | null;
  openPreview: (documentId: string, documentName: string, highlightChunkIndex?: number | null) => void;
  closePreview: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  isOpen: false,
  documentId: null,
  documentName: null,
  highlightChunkIndex: null,

  openPreview: (documentId, documentName, highlightChunkIndex = null) =>
    set({
      isOpen: true,
      documentId,
      documentName,
      highlightChunkIndex,
    }),

  closePreview: () =>
    set({
      isOpen: false,
      documentId: null,
      documentName: null,
      highlightChunkIndex: null,
    }),
}));
