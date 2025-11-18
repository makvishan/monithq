
import { SiteStatus } from '@prisma/client';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format uptime percentage
 */
export function formatUptime(uptime) {
  return `${uptime.toFixed(2)}%`;
}

/**
 * Format response time
 */
export function formatResponseTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format date/time
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
  const colors = {
    online: 'text-green-500 bg-green-500/10',
    offline: 'text-red-500 bg-red-500/10',
    degraded: 'text-yellow-500 bg-yellow-500/10',
    maintenance: 'text-blue-500 bg-blue-500/10',
  };
  return colors[status] || colors.offline;
}

/**
 * Get status badge color
 */
export function getStatusBadge(status) {
  const badges = {
    [SiteStatus.ONLINE]: 'bg-green-500',
    [SiteStatus.OFFLINE]: 'bg-red-500',
    [SiteStatus.DEGRADED]: 'bg-yellow-500',
    [SiteStatus.MAINTENANCE]: 'bg-blue-500',
  };
  return badges[status] || badges[SiteStatus.OFFLINE];
}

/**
 * Calculate average from array
 */
export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Generate random data for charts (development only)
 */
export function generateUptimeData(days = 7) {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uptime: 95 + Math.random() * 5,
      responseTime: 100 + Math.random() * 200,
    });
  }
  
  return data;
}

/**
 * Format duration in ms to human readable
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}



// Utility function to format interval in seconds to human readable string
export function formatInterval(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''}`;
}
// Utility function to format currency amounts
export function formatAmount(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}