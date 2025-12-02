/**
 * Validation utilities
 * Pure functions with no external dependencies
 */

export function isValidNickname(nickname: string): boolean {
  return /^[a-zA-Z0-9\s_-]{1,20}$/.test(nickname.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateAnonymousId(): string {
  return `User-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateEphemeralId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
