'use client';

import { usePreviewStore } from '@/store/previewStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DocumentPreviewPanel } from './DocumentPreviewPanel';

export function DocumentPreviewModal() {
  const { isOpen, documentName, closePreview } = usePreviewStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col p-0 overflow-hidden shadow-2xl transition-all duration-300">
        {/* Visually hidden headers for screen reader accessibility compliance */}
        <div className="sr-only">
          <DialogTitle>{documentName || 'Document Preview'}</DialogTitle>
          <DialogDescription>
            Interactive previewer for document text segments, metadata details, and formatting.
          </DialogDescription>
        </div>
        <DocumentPreviewPanel onClose={closePreview} />
      </DialogContent>
    </Dialog>
  );
}
