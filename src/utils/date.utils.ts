/**
 * Date formatting utilities
 * Pure functions with no external dependencies
 */

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatFullTimestamp(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timestampNumber = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const today = new Date();
  
  const isToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  
  if (isToday) return formatTimestamp(timestampNumber);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month} ${formatTimestamp(timestampNumber)}`;
}
