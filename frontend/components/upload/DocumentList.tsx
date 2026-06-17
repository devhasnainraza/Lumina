'use client';

import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { FileText, Trash2, CheckCircle, XCircle, Loader2, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatBytes, formatRelativeTime } from '@/lib/utils/format';
import type { Document } from '@/types/document';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { usePreviewStore } from '@/store/previewStore';

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [documentToRename, setDocumentToRename] = useState<Document | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const openPreview = usePreviewStore((state) => state.openPreview);

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
  });

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
  };

  const renameMutation = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) => documentsApi.rename(id, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setRenameDialogOpen(false);
      setDocumentToRename(null);
      setNewFilename('');
      toast.success('Document renamed successfully');
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to rename';
      toast.error(`Rename failed: ${errMsg}`);
    }
  });

  const handleRenameClick = (doc: Document) => {
    setDocumentToRename(doc);
    setNewFilename(doc.filename);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (documentToRename && newFilename.trim()) {
      renameMutation.mutate({ id: documentToRename.id, filename: newFilename.trim() });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-surface border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatBytes(doc.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPreview(doc.id, doc.filename)}
                    className="text-text-muted hover:text-primary hover:bg-white/5 flex-shrink-0 cursor-pointer h-8 w-8 p-0"
                    title="Preview document segments"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRenameClick(doc)}
                  className="text-text-muted hover:text-primary hover:bg-white/5 flex-shrink-0 cursor-pointer h-8 w-8 p-0"
                  title="Rename document"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(doc.id)}
                  className="text-text-muted hover:text-error hover:bg-white/5 flex-shrink-0 cursor-pointer h-8 w-8 p-0"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {doc.status === 'completed' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">Completed</span>
                  </>
                )}
                {doc.status === 'processing' && (
                  <>
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-primary">Processing</span>
                  </>
                )}
                {doc.status === 'uploaded' && (
                  <>
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-primary">Uploaded</span>
                  </>
                )}
                {doc.status === 'failed' && (
                  <>
                    <XCircle className="w-4 h-4 text-error" />
                    <span className="text-xs text-error">Failed</span>
                  </>
                )}
              </div>

              <span className="text-xs text-text-muted">
                {formatRelativeTime(doc.createdAt)}
              </span>
            </div>

            {doc.status === 'failed' && doc.errorMessage && (
              <p className="text-xs text-error mt-2">{doc.errorMessage}</p>
            )}
          </motion.div>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleConfirmRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-text-primary">Rename Document</DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Enter a new name for this document. The file type extension must remain the same.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <input
                type="text"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all font-medium animate-in fade-in"
                placeholder="Enter new filename..."
                required
                disabled={renameMutation.isPending}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={renameMutation.isPending}
                className="rounded-xl h-10 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending || !newFilename.trim()}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl h-10 text-xs font-semibold shadow-md shadow-primary/20 cursor-pointer"
              >
                {renameMutation.isPending ? 'Renaming...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
