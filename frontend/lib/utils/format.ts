/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format date to relative time for session list
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  let then: Date;

  // Parse the date - handle both string and Date objects
  if (typeof date === 'string') {
    // If the date string doesn't include timezone info, assume UTC
    then = new Date(date.includes('Z') || date.includes('+') ? date : date + 'Z');
  } else {
    then = date;
  }

  // Check if date is valid
  if (isNaN(then.getTime())) {
    return '';
  }

  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Just now (less than 1 minute)
  if (diffInMinutes < 1) {
    return 'just now';
  }

  // Minutes ago
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Hours ago
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'yesterday';
  }

  // Days ago (2-6 days)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // Weeks ago (1-3 weeks)
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  // More than a month - show date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[then.getMonth()];
  const day = then.getDate();
  const year = then.getFullYear();
  const currentYear = now.getFullYear();

  // Same year - don't show year
  if (year === currentYear) {
    return `${month} ${day}`;
  }

  // Different year - show full date
  return `${month} ${day}, ${year}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
