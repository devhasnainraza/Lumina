
'use client';

import { MessageSquare, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRelativeTime, truncate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ChatSession } from '@/types/chat';
import { Button } from '@/components/ui/button';

interface SessionListItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SessionListItem({ session, isActive, onClick, onDelete }: SessionListItemProps) {
  const title = session.title || 'New Conversation';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 relative overflow-hidden',
        isActive
          ? 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-primary/35 text-white shadow-md shadow-primary/5'
          : 'hover:bg-white/5 border-transparent text-text-secondary hover:text-text-primary'
      )}
    >
      {/* Active side indicator */}
      {isActive && (
        <motion.div 
          layoutId="activeSessionIndicator" 
          className="absolute left-0 top-1/4 bottom-1/4 w-0.75 rounded-r-md bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}

      <motion.div
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        <MessageSquare className={cn(
          'w-4.5 h-4.5 flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
        )} />
      </motion.div>
 
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-semibold truncate transition-colors',
          isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
        )}>
          {truncate(title, 30)}
        </p>
        <p className="text-[10px] mt-0.5 text-text-muted leading-none">
          {formatRelativeTime(session.updatedAt)} • {session.messageCount} message{session.messageCount !== 1 && 's'}
        </p>
      </div>
 
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="flex-shrink-0 h-7 w-7 p-0 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
