'use client';

import { useUploadStore } from '@/store/uploadStore';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

export function UploadProgress() {
  const uploads = useUploadStore((state) => state.uploads);
  const removeUpload = useUploadStore((state) => state.removeUpload);

  const uploadArray = Array.from(uploads.values());

  if (uploadArray.length === 0) return null;

  return (
    <div className="space-y-3">
      {uploadArray.map((upload) => (
        <div
          key={upload.filename}
          className="bg-surface border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-text-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {upload.filename}
                </p>
                <p className="text-xs text-text-muted">
                  {formatBytes(upload.fileSize)}
                </p>
              </div>
            </div>

            {upload.status === 'complete' && (
              <button
                onClick={() => removeUpload(upload.filename)}
                className="text-success hover:text-success/80 flex-shrink-0"
                title="Dismiss"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
            {upload.status === 'failed' && (
              <button
                onClick={() => removeUpload(upload.filename)}
                className="text-error hover:text-error/80 flex-shrink-0"
                title="Dismiss"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
            {(upload.status === 'uploading' || upload.status === 'processing') && (
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            )}
          </div>

          {upload.status === 'uploading' && (
            <Progress value={upload.percentage} className="h-2" />
          )}

          {upload.status === 'processing' && (
            <p className="text-xs text-text-muted">Processing document...</p>
          )}

          {upload.status === 'failed' && upload.error && (
            <p className="text-xs text-error mt-1">{upload.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
