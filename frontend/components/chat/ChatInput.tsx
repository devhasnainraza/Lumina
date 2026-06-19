'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send } from 'lucide-react';
import { useStreaming } from '@/lib/hooks/useStreaming';
import { useChatStore } from '@/store/chatStore';
import { useUpload } from '@/lib/hooks/useUpload';
import { toast } from 'sonner';

export function ChatInput() {
  const [query, setQuery] = useState('');
  const { currentSessionId, addMessage, isStreaming } = useChatStore();
  const { startStreaming } = useStreaming(currentSessionId);
  const { uploadFile } = useUpload();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea height dynamic adjustment
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [query]);

  // Listen for suggestion clicks
  useEffect(() => {
    const handleSuggestionClick = (e: CustomEvent) => {
      setQuery(e.detail);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    };

    window.addEventListener('suggestion-click', handleSuggestionClick as EventListener);
    return () => window.removeEventListener('suggestion-click', handleSuggestionClick as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const userMessage = {
      id: Math.random().toString(36),
      role: 'user' as const,
      content: query,
      createdAt: new Date().toISOString(),
    };

    addMessage(userMessage);
    setQuery('');

    // Reset height of textarea back to original layout size
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }

    try {
      await startStreaming(query);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info(`Uploading ${file.name}...`);
      await uploadFile(file);
      toast.success(`Successfully uploaded ${file.name}! Processing context...`);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message || 'Error occurred'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-transparent p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
          
          {/* Pill-shaped Input Container (Matches the web UI surface colors) */}
          <div className="flex-1 flex items-center bg-surface-secondary/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 focus-within:border-white/20 focus-within:bg-surface-secondary/60 transition-all duration-200 shadow-lg shadow-black/10">
            {/* Document Upload Button */}
            <button
              type="button"
              onClick={triggerFileUpload}
              disabled={isStreaming}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer shrink-0"
              title="Upload file"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.csv"
              className="hidden"
            />

            {/* Input field (Textarea to allow multi-line while looking like single-line) */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chat with your documents..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 min-h-[36px] max-h-[120px] py-2 px-2.5 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-text-primary placeholder:text-text-muted/40 resize-none font-sans text-[14px] leading-normal"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {/* Circular Send Button (Colored to match primary web UI themes) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="shrink-0"
          >
            <button
              type="submit"
              disabled={!query.trim() || isStreaming}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500/95 text-white flex items-center justify-center shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4.5 h-4.5 text-white translate-x-[0.5px]" />
            </button>
          </motion.div>

        </form>
      </div>
    </div>
  );
}
