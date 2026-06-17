'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePreviewStore } from '@/store/previewStore';
import { useDocumentChunks, useDocument } from '@/lib/hooks/useDocuments';
import { documentsApi } from '@/lib/api/documents';
import { Search, FileText, Loader2, Copy, Check, Hash, Info, Download, Layers, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatBytes } from '@/lib/utils/format';

interface DocumentPreviewPanelProps {
  onClose?: () => void;
}

export function DocumentPreviewPanel({ onClose }: DocumentPreviewPanelProps) {
  const { documentId, documentName, highlightChunkIndex } = usePreviewStore();
  const { data: documentInfo, isLoading: isLoadingInfo } = useDocument(documentId || '');
  const { data: chunks, isLoading: isLoadingChunks, error } = useDocumentChunks(documentId || '');

  const [activeTab, setActiveTab] = useState<'original' | 'chunks'>('original');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chunkRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Reset tab when document opens or highlight changes
  useEffect(() => {
    setSearchQuery('');
    if (highlightChunkIndex !== null) {
      setActiveTab('chunks');
    } else {
      setActiveTab('original');
    }
  }, [documentId, highlightChunkIndex]);

  // Fetch document original file as a Blob URL
  useEffect(() => {
    if (documentId) {
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
  }, [documentId]);

  // Scroll to cited chunk when loaded
  useEffect(() => {
    if (activeTab === 'chunks' && highlightChunkIndex !== null && chunks && chunkRefs.current[highlightChunkIndex]) {
      const timer = setTimeout(() => {
        chunkRefs.current[highlightChunkIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, highlightChunkIndex, chunks]);

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

  return (
    <div className="flex flex-col h-full bg-surface/95 border-l border-white/10 overflow-hidden relative">
      {/* Panel Header */}
      <div className="p-4 md:p-6 pb-4 border-b border-white/10 flex flex-col gap-3 flex-shrink-0 bg-white/[0.01]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg flex-shrink-0",
              getFileIconColor(documentInfo?.fileType)
            )}>
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text-primary truncate pr-2">
                {documentName || 'Document Preview'}
              </h3>
              <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                {documentInfo && (
                  <>
                    <span>{formatBytes(documentInfo.fileSize)}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="capitalize">{documentInfo.fileType}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{documentInfo.chunkCount} Segments</span>
                  </>
                )}
                {!documentInfo && isLoadingInfo && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" /> Loading...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-all cursor-pointer flex-shrink-0"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1.5 p-1 bg-white/5 border border-white/5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('original')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'original'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-text-muted hover:text-white"
            )}
          >
            <Eye className="w-3 h-3" />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'chunks'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-text-muted hover:text-white"
            )}
          >
            <Layers className="w-3 h-3" />
            <span>Segments</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Original Viewer */}
      {activeTab === 'original' && (
        <div className="flex-1 min-h-0 w-full flex flex-col p-4 md:p-6 bg-black/10">
          {isLoadingFile && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-text-secondary font-medium">Loading original format...</p>
            </div>
          )}
          
          {fileError && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 max-w-md">
                <Info className="w-4 h-4 text-error flex-shrink-0" />
                <p className="text-error text-xs font-semibold">
                  Failed to fetch the file contents from storage.
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
                  className="w-full h-full border border-white/5 rounded-xl bg-surface/50 p-4 text-text-primary font-mono text-xs shadow-inner overflow-auto"
                  title="TXT Document Viewer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-surface/30 rounded-xl border border-white/5 shadow-inner gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-xs font-bold text-text-primary">Preview Not Supported Directly</h3>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Word documents (.docx) cannot be rendered natively inside the browser. Click below to download and view the original file.
                    </p>
                  </div>
                  <a
                    href={fileUrl}
                    download={documentName || 'document'}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original</span>
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
          <div className="px-4 md:px-6 py-3 border-b border-white/5 flex-shrink-0 bg-white/[0.005]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
              />
            </div>
          </div>

          {/* Scrollable Chunks Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-black/10">
            {isLoadingChunks && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-text-secondary font-medium">Parsing segments...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
                <Info className="w-4 h-4 text-error flex-shrink-0" />
                <p className="text-error text-xs font-semibold">
                  Failed to load segments.
                </p>
              </div>
            )}

            {!isLoadingChunks && !error && filteredChunks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-text-muted">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No matching segments found</p>
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
                    "relative group/card bg-white/[0.02] border rounded-xl p-4 transition-all duration-300 flex flex-col gap-2.5",
                    isHighlighted 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.12)]" 
                      : "border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm border",
                        isHighlighted
                          ? "bg-primary/20 text-primary border-primary/20"
                          : "bg-white/5 text-text-secondary border-white/5"
                      )}>
                        <Hash className="w-2.5 h-2.5" />
                        Seg {chunk.chunkIndex + 1}
                      </span>
                      <span className="text-[9px] text-text-muted font-semibold">
                        {chunk.tokenCount} tokens
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyChunk(chunk.text, chunk.chunkIndex)}
                      className="opacity-0 group-hover/card:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 hover:border-white/20 shadow-md cursor-pointer"
                      title="Copy segment text"
                    >
                      {copiedIndex === chunk.chunkIndex ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Chunk Text */}
                  <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap select-text selection:bg-primary/30 font-normal">
                    {chunk.text}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
