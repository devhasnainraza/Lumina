'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePreviewStore } from '@/store/previewStore';
import { useDocumentChunks, useDocument } from '@/lib/hooks/useDocuments';
import { documentsApi } from '@/lib/api/documents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, FileText, Loader2, Copy, Check, Hash, Info, Download, Layers, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatBytes } from '@/lib/utils/format';

export function DocumentPreviewModal() {
  const { isOpen, documentId, documentName, highlightChunkIndex, closePreview } = usePreviewStore();
  const { data: documentInfo, isLoading: isLoadingInfo } = useDocument(documentId || '');
  const { data: chunks, isLoading: isLoadingChunks, error } = useDocumentChunks(documentId || '');

  const [activeTab, setActiveTab] = useState<'original' | 'chunks'>('original');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chunkRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Reset tab and fetch file url when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (highlightChunkIndex !== null) {
        setActiveTab('chunks');
      } else {
        setActiveTab('original');
      }
    }
  }, [isOpen, highlightChunkIndex]);

  // Fetch document original file as a Blob URL
  useEffect(() => {
    if (isOpen && documentId) {
      setIsLoadingFile(true);
      setFileError(false);
      
      documentsApi.viewFile(documentId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
          setIsLoadingFile(false);
        })
        .catch((err) => {
          console.error('Error fetching file preview blob:', err);
          setFileError(true);
          setIsLoadingFile(false);
        });
    }

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    };
  }, [isOpen, documentId]);

  // Scroll to cited chunk when loaded
  useEffect(() => {
    if (isOpen && activeTab === 'chunks' && highlightChunkIndex !== null && chunks && chunkRefs.current[highlightChunkIndex]) {
      const timer = setTimeout(() => {
        chunkRefs.current[highlightChunkIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, highlightChunkIndex, chunks]);

  // Filter chunks by search query
  const filteredChunks = useMemo(() => {
    if (!chunks) return [];
    if (!searchQuery.trim()) return chunks;
    
    const query = searchQuery.toLowerCase();
    return chunks.filter(chunk => chunk.text.toLowerCase().includes(query));
  }, [chunks, searchQuery]);

  const handleCopyChunk = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy chunk text: ', err);
    }
  };

  const getFileIconColor = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return 'text-red-400 bg-red-400/10 border-red-500/20';
      case 'docx':
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const handleClose = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    closePreview();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col p-0 overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex flex-col gap-3 flex-shrink-0 bg-white/[0.01]">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg flex-shrink-0",
                getFileIconColor(documentInfo?.fileType)
              )}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <DialogTitle className="text-lg font-bold text-text-primary truncate pr-8">
                  {documentName || 'Document Preview'}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                  {documentInfo && (
                    <>
                      <span>Size: {formatBytes(documentInfo.fileSize)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <span className="capitalize">Type: {documentInfo.fileType}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <span>{documentInfo.chunkCount} Total Segments</span>
                    </>
                  )}
                  {!documentInfo && isLoadingInfo && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading metadata...
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Premium Tab Selector */}
          <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('original')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'original'
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-muted hover:text-white"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Viewer</span>
            </button>
            <button
              onClick={() => setActiveTab('chunks')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'chunks'
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-muted hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>RAG Segments</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Original Viewer */}
        {activeTab === 'original' && (
          <div className="flex-1 min-h-0 w-full flex flex-col p-6 bg-black/10">
            {isLoadingFile && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-text-secondary font-medium">Loading original document format...</p>
              </div>
            )}
            
            {fileError && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 max-w-md">
                  <Info className="w-5 h-5 text-error flex-shrink-0" />
                  <p className="text-error text-xs font-semibold">
                    Failed to fetch the file contents from storage. Please try again.
                  </p>
                </div>
              </div>
            )}

            {!isLoadingFile && !fileError && fileUrl && (
              <div className="flex-1 min-h-0 w-full relative">
                {documentInfo?.fileType === 'pdf' ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full border-none rounded-xl bg-surface/50 shadow-2xl"
                    title="PDF Document Viewer"
                  />
                ) : documentInfo?.fileType === 'txt' ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full border border-white/5 rounded-xl bg-surface/50 p-4 text-text-primary font-mono text-sm shadow-inner"
                    title="TXT Document Viewer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-surface/30 rounded-xl border border-white/5 shadow-inner gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h3 className="text-sm font-bold text-text-primary">Preview Not Supported Directly</h3>
                      <p className="text-xs text-text-muted">
                        Word documents (.docx) cannot be rendered natively inside the browser. Click below to download and view the original file.
                      </p>
                    </div>
                    <a
                      href={fileUrl}
                      download={documentName || 'document'}
                      className="px-4.5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Original File</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chunks Preview */}
        {activeTab === 'chunks' && (
          <>
            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-white/5 flex-shrink-0 bg-white/[0.005]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search content in this document segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                />
              </div>
            </div>

            {/* Scrollable Chunks Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/10">
              {isLoadingChunks && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-text-secondary font-medium">Parsing document segments...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
                  <Info className="w-5 h-5 text-error flex-shrink-0" />
                  <p className="text-error text-xs font-semibold">
                    Failed to load document text chunks. Please try again.
                  </p>
                </div>
              )}

              {!isLoadingChunks && !error && filteredChunks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-text-muted">
                  <Search className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No matching text segments found</p>
                  {searchQuery && <p className="text-xs mt-1">Try searching for different keywords</p>}
                </div>
              )}

              {!isLoadingChunks && !error && filteredChunks.map((chunk) => {
                const isHighlighted = highlightChunkIndex === chunk.chunkIndex;
                return (
                  <div
                    key={chunk.id}
                    ref={(el) => {
                      chunkRefs.current[chunk.chunkIndex] = el;
                    }}
                    className={cn(
                      "relative group/card bg-white/[0.02] border rounded-xl p-5 transition-all duration-300 flex flex-col gap-3",
                      isHighlighted 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(124,58,237,0.15)]" 
                        : "border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Chunk Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm border",
                          isHighlighted
                            ? "bg-primary/20 text-primary border-primary/20"
                            : "bg-white/5 text-text-secondary border-white/5"
                        )}>
                          <Hash className="w-3 h-3" />
                          Segment {chunk.chunkIndex + 1}
                        </span>
                        <span className="text-[10px] text-text-muted font-semibold">
                          {chunk.tokenCount} tokens
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyChunk(chunk.text, chunk.chunkIndex)}
                        className="opacity-0 group-hover/card:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 hover:border-white/20 shadow-md cursor-pointer"
                        title="Copy segment text"
                      >
                        {copiedIndex === chunk.chunkIndex ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Chunk Text */}
                    <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap select-text selection:bg-primary/30 font-normal">
                      {chunk.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
