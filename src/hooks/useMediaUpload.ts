import { useState, useCallback } from 'react';
import { storageService } from '../services/storage.service';
import { useCryptoContext } from '../contexts/CryptoContext';

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { encryptionKey } = useCryptoContext();

  const uploadFile = useCallback(async (file: File) => {
    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await storageService.processFile(
        file,
        encryptionKey,
        (p) => setProgress(p)
      );
      
      setUploading(false);
      return result;
    } catch (error: any) {
      setUploading(false);
      throw error;
    }
  }, [encryptionKey]);

  const downloadFile = useCallback(async (
    url: string,
    fileName: string,
    fileType: string
  ) => {
    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      await storageService.downloadDecryptedFile(url, fileName, fileType, encryptionKey);
    } catch (error: any) {
      throw new Error('Failed to download file');
    }
  }, [encryptionKey]);

  return {
    uploadFile,
    downloadFile,
    uploading,
    progress
  };
}
