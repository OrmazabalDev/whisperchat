/**
 * CryptoContext - Manage encryption keys and state
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cryptoService } from '../services/crypto.service';

interface CryptoContextType {
  encryptionKey: CryptoKey | null;
  loading: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  encryptMessage: (message: string) => Promise<string>;
  decryptMessage: (encrypted: string) => Promise<string>;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

const PUBLIC_ROOM_PASSPHRASE = 'whisperchat-public-room-2024-v1';

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabledState] = useState(cryptoService.isEncryptionEnabled());

  useEffect(() => {
    if (!enabled) {
      setEncryptionKey(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    cryptoService
      .initializeEncryptionKeyFromRoom(PUBLIC_ROOM_PASSPHRASE)
      .then(key => {
        if (mounted) setEncryptionKey(key);
      })
      .catch(() => {
        if (mounted) setEncryptionKey(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled);
    cryptoService.setEncryptionEnabled(newEnabled);
    
    if (!newEnabled) {
      setEncryptionKey(null);
      cryptoService.clearCache();
    }
  }, []);

  const encryptMessage = useCallback(async (message: string): Promise<string> => {
    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }
    return cryptoService.encryptMessage(message, encryptionKey);
  }, [encryptionKey]);

  const decryptMessage = useCallback(async (encrypted: string): Promise<string> => {
    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }
    return cryptoService.decryptMessage(encrypted, encryptionKey);
  }, [encryptionKey]);

  return (
    <CryptoContext.Provider 
      value={{ 
        encryptionKey, 
        loading, 
        enabled, 
        setEnabled,
        encryptMessage,
        decryptMessage
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCryptoContext() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCryptoContext must be used within CryptoProvider');
  }
  return context;
}
