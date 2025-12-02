import { getLocalStorageItem, setLocalStorageItem } from '../utils/storage.utils';

const ENCRYPTION_KEY_NAME = 'whisperchat_encryption_key';
const ENCRYPTION_ENABLED_KEY = 'whisperchat_encryption_enabled';

class CryptoService {
  private static instance: CryptoService;
  private cachedKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  async deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const FIXED_SALT = 'whisperchat-public-room-salt-v1';
    const salt = encoder.encode(FIXED_SALT);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 310000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    this.cachedKey = key;
    return key;
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  private async importKey(base64Key: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async storeEncryptionKey(key: CryptoKey): Promise<void> {
    const exportedKey = await this.exportKey(key);
    setLocalStorageItem(ENCRYPTION_KEY_NAME, exportedKey);
    this.cachedKey = key;
  }

  async getStoredEncryptionKey(): Promise<CryptoKey | null> {
    if (this.cachedKey) return this.cachedKey;

    const base64Key = getLocalStorageItem(ENCRYPTION_KEY_NAME);
    if (!base64Key) return null;
    
    try {
      const key = await this.importKey(base64Key);
      this.cachedKey = key;
      return key;
    } catch {
      return null;
    }
  }

  async initializeEncryptionKeyFromRoom(roomPassphrase: string): Promise<CryptoKey> {
    const key = await this.deriveKeyFromPassphrase(roomPassphrase);
    await this.storeEncryptionKey(key);
    return key;
  }

  async encryptMessage(message: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(message)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  async decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }

  isEncryptionEnabled(): boolean {
    const stored = getLocalStorageItem(ENCRYPTION_ENABLED_KEY);
    if (stored === null) {
      this.setEncryptionEnabled(true);
      return true;
    }
    return stored === 'true';
  }

  setEncryptionEnabled(enabled: boolean): void {
    setLocalStorageItem(ENCRYPTION_ENABLED_KEY, enabled.toString());
    if (!enabled) {
      this.cachedKey = null;
    }
  }

  clearCache(): void {
    this.cachedKey = null;
  }
}

export const cryptoService = CryptoService.getInstance();
