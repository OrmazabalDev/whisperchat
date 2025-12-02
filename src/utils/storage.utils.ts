/**
 * Storage utilities for sessionStorage and localStorage
 * Pure functions with no external dependencies
 */

export function setStorageItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

export function getStorageItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeStorageItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function setLocalStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getLocalStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearSessionData(): void {
  sessionStorage.removeItem('chatNickname');
  sessionStorage.removeItem('ephemeral_session_id');
}
