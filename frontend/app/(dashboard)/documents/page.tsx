'use client';

import { DropZone } from '@/components/upload/DropZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { DocumentList } from '@/components/upload/DocumentList';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, FileText, Activity } from 'lucide-react';

import { useEffect } from 'react';
import { useUploadStore } from '@/store/uploadStore';

export default function DocumentsPage() {
  const { data, isLoading, error } = useDocuments();
  const uploads = useUploadStore((state) => state.uploads);
  const removeUpload = useUploadStore((state) => state.removeUpload);
  const setError = useUploadStore((state) => state.setError);
  const setStatus = useUploadStore((state) => state.setStatus);

  useEffect(() => {
    if (data?.documents) {
      data.documents.forEach((doc) => {
        const upload = uploads.get(doc.filename);
        if (upload) {
          if (doc.status === 'completed') {
            removeUpload(doc.filename);
          } else if (doc.status === 'failed') {
            setError(doc.filename, doc.errorMessage || 'Processing failed');
          } else if (doc.status === 'processing' && upload.status !== 'processing') {
            setStatus(doc.filename, 'processing');
          }
        }
      });
    }
  }, [data?.documents, uploads, removeUpload, setError, setStatus]);

  return (
    <div className="relative min-h-screen pb-12 pt-[90px] px-4 md:px-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Background Radial Glow Blobs */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full glow-blob-primary opacity-20 pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full glow-blob-secondary opacity-15 pointer-events-none -z-10" />

      {/* Sticky Glassmorphic Header (matches chat & analytics) */}
      <header className="glass-navbar fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5 pl-16 md:pl-6 min-h-[73px]">
        <div className="flex flex-col min-w-0">
          <h2 className="text-base font-bold text-text-primary truncate">
            Knowledge Base
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
              <Database className="w-3 h-3 text-primary" />
              Connected Vector Index
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
        </div>
        
        {/* Quick status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
          <Activity className="w-3 h-3 text-primary" />
          <span>Syncing Database</span>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl mb-6 flex items-center gap-3 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-error" />
          <p className="text-error text-xs font-semibold">
            Failed to load documents. Please refresh and try again.
          </p>
        </div>
      )}

      <div className="space-y-8 relative z-10">
        <DropZone />

        <UploadProgress />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider text-xs">
                <FileText className="w-4 h-4 text-primary" />
                Your Documents ({data.total})
              </h2>
            </div>
            <DocumentList documents={data.documents} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

