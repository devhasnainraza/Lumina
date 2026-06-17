'use client';

import { useState, useEffect } from 'react';
import { useUploadStore } from '@/store/uploadStore';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

function ProcessingTimeline() {
  const [subStep, setSubStep] = useState(0);

  useEffect(() => {
    // Cycle through steps 0 to 3 over 4.8 seconds (1.2s per step)
    const interval = setInterval(() => {
      setSubStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const subSteps = [
    'Extracting document text & layout...',
    'Performing semantic text chunking...',
    'Calculating vector embeddings...',
    'Indexing vectors in database...',
  ];

  return (
    <div className="mt-3.5 space-y-2 bg-black/20 border border-white/5 p-3 rounded-xl">
      <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted">
        Ingestion Pipeline
      </span>
      <div className="flex items-center gap-2 mt-0.5">
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        <span className="text-xs font-semibold text-text-primary">
          {subSteps[subStep]}
        </span>
      </div>
      {/* Micro Step Indicators */}
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === subStep
                ? 'bg-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]'
                : idx < subStep
                ? 'bg-success'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
                className="text-success hover:text-success/80 flex-shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
            {upload.status === 'failed' && (
              <button
                onClick={() => removeUpload(upload.filename)}
                className="text-error hover:text-error/80 flex-shrink-0 cursor-pointer"
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
            <ProcessingTimeline />
          )}

          {upload.status === 'failed' && upload.error && (
            <p className="text-xs text-error mt-1">{upload.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
