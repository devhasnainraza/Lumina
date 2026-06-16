import { create } from 'zustand';
import type { UploadProgress } from '@/types/document';

interface UploadState {
  uploads: Map<string, UploadProgress>;
  addUpload: (filename: string, fileSize: number) => void;
  updateProgress: (filename: string, bytesUploaded: number) => void;
  setStatus: (filename: string, status: UploadProgress['status']) => void;
  setError: (filename: string, error: string) => void;
  removeUpload: (filename: string) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: new Map(),

  addUpload: (filename, fileSize) =>
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.set(filename, {
        filename,
        fileSize,
        bytesUploaded: 0,
        percentage: 0,
        status: 'pending',
      });
      return { uploads: newUploads };
    }),

  updateProgress: (filename, bytesUploaded) =>
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(filename);
      if (upload) {
        const percentage = Math.round((bytesUploaded / upload.fileSize) * 100);
        newUploads.set(filename, {
          ...upload,
          bytesUploaded,
          percentage,
          status: 'uploading',
        });
      }
      return { uploads: newUploads };
    }),

  setStatus: (filename, status) =>
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(filename);
      if (upload) {
        newUploads.set(filename, { ...upload, status });
      }
      return { uploads: newUploads };
    }),

  setError: (filename, error) =>
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(filename);
      if (upload) {
        newUploads.set(filename, { ...upload, status: 'failed', error });
      }
      return { uploads: newUploads };
    }),

  removeUpload: (filename) =>
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.delete(filename);
      return { uploads: newUploads };
    }),
}));
