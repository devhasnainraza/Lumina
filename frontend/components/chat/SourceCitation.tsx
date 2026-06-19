'use client';

import { memo, useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceCitation as SourceCitationType } from '@/types/chat';
import { usePreviewStore } from '@/store/previewStore';

interface SourceCitationProps {
  source: SourceCitationType;
}

export const SourceCitation = memo(function SourceCitation({ source }: SourceCitationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const openPreview = usePreviewStore((state) => state.openPreview);

  const handleClick = () => {
    if (source.documentId) {
      openPreview(source.documentId, source.documentName, source.chunkIndex);
    }
  };

  return (
    <motion.div
      className="relative inline-flex"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary/50 backdrop-blur-sm border border-white/10 rounded-lg text-sm hover:bg-surface-secondary/70 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/10 cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <FileText className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-text-secondary group-hover:text-text-primary transition-colors font-medium leading-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
            {source.documentName}
          </span>
          {source.pageReference && (
            <span className="text-text-muted text-xs truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
              {source.pageReference}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded">
            {Math.round(source.relevanceScore * 100)}%
          </span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-white/20 rounded-lg shadow-xl backdrop-blur-md z-10 pointer-events-none min-w-[200px]"
          >
            <div className="text-xs text-text-secondary space-y-1">
              <p className="font-semibold text-text-primary">
                {source.documentName}
              </p>
              <p>Relevance: {Math.round(source.relevanceScore * 100)}%</p>
              {source.pageReference && (
                <p>Location: {source.pageReference}</p>
              )}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-surface border-r border-b border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
