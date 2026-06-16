export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-secondary rounded ${className}`}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-4 justify-start">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex flex-col gap-2 flex-1 max-w-3xl">
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <MessageSkeleton />
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  );
}
