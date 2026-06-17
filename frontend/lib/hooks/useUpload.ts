import { useUploadStore } from '@/store/uploadStore';
import { useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { validateFile } from '@/lib/utils/validation';

export function useUpload() {
  const uploadStore = useUploadStore();
  const queryClient = useQueryClient();

  const uploadFile = async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Add to upload store
    uploadStore.addUpload(file.name, file.size);

    try {
      const response = await documentsApi.upload(file, (progressEvent) => {
        if (progressEvent.total) {
          uploadStore.updateProgress(file.name, progressEvent.loaded);
        }
      });

      uploadStore.setStatus(file.name, 'processing');

      // Invalidate documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });

      return response;
    } catch (error: any) {
      uploadStore.setStatus(file.name, 'failed');
      uploadStore.setError(file.name, error.message || 'Upload failed');
      throw error;
    }
  };

  return { uploadFile };
}
