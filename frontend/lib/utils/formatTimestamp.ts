export function formatTimestamp(date: string | Date): string {
  const now = new Date();
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Just now (< 1 minute)
  if (diffMins < 1) {
    return 'Just now';
  }

  // Minutes ago (< 1 hour)
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  }

  // Hours ago (< 24 hours, same day)
  if (diffHours < 24 && messageDate.getDate() === now.getDate()) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Today at time
  if (messageDate.getDate() === now.getDate()) {
    return `Today at ${messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  }

  // Yesterday at time
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth()) {
    return `Yesterday at ${messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  }

  // This week (within 7 days)
  if (diffDays < 7) {
    return messageDate.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // This year (Month Day at Time)
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Different year (Full date)
  return messageDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
