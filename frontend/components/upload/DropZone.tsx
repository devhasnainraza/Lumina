'use client';

import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUpload } from '@/lib/hooks/useUpload';

export function DropZone() {
  const { uploadFile } = useUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);

      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }

      // Reset input
      e.target.value = '';
    },
    [uploadFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragging ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50'
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt"
        multiple
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="mx-auto h-12 w-12 text-text-muted mb-4" />
        <p className="text-text-primary font-medium mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-text-muted">
          PDF, DOCX, TXT (max 10MB)
        </p>
      </label>
    </div>
  );
}
