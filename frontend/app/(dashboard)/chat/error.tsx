'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Chat error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">
          {error.message || 'An error occurred while loading the chat interface.'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
