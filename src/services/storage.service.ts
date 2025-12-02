const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain'
];

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo imágenes, PDF y TXT.'
      };
    }

    return { valid: true };
  }

  async encryptFile(file: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      file
    );

    const encryptedArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);
    return combined.buffer;
  }

  async decryptFile(encryptedBuffer: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const data = new Uint8Array(encryptedBuffer);
    const iv = data.slice(0, 12);
    const content = data.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      content
    );

    return decryptedContent;
  }

  arrayBufferToDataUrl(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    const base64Data = btoa(
      uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return `data:application/octet-stream;base64,${base64Data}`;
  }

  dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
    const base64Data = dataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  async processFile(
    file: File,
    encryptionKey: CryptoKey,
    onProgress?: (progress: number) => void
  ): Promise<{
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
  }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.(0);
    const fileBuffer = await file.arrayBuffer();
    onProgress?.(33);
    const encryptedBuffer = await this.encryptFile(fileBuffer, encryptionKey);
    onProgress?.(66);
    const dataUrl = this.arrayBufferToDataUrl(encryptedBuffer);
    onProgress?.(100);

    return {
      url: dataUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath: ''
    };
  }

  async downloadDecryptedFile(
    url: string,
    fileName: string,
    fileType: string,
    encryptionKey: CryptoKey
  ): Promise<void> {
    const encryptedBuffer = this.dataUrlToArrayBuffer(url);
    const decryptedBuffer = await this.decryptFile(encryptedBuffer, encryptionKey);
    
    const blob = new Blob([decryptedBuffer], { type: fileType });
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }
}

export const storageService = StorageService.getInstance();
