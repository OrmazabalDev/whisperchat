import { 
  ref, 
  push, 
  onValue, 
  query, 
  orderByChild, 
  limitToLast, 
  serverTimestamp, 
  update,
  set,
  remove,
  onDisconnect,
  DatabaseReference
} from 'firebase/database';
import { db } from '../firebase';
import type { Reaction } from '../types';

interface MessageData {
  text: string;
  nickname: string;
  sessionId: string;
  timestamp: number;
  createdAt: any;
  encrypted: boolean;
  encryptedContent?: string;
  fileUrl?: string;
  fileName?: string;
  encryptedFileName?: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
  encryptedFile?: boolean;
}

class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  getMessagesRef(): DatabaseReference {
    return ref(db, 'messages');
  }

  getPresenceRef(userId: string): DatabaseReference {
    return ref(db, `presence/${userId}`);
  }

  getTypingRef(userId: string): DatabaseReference {
    return ref(db, `typing/${userId}`);
  }

  listenToMessages(
    callback: (snapshot: any) => void,
    onError?: (error: any) => void
  ): () => void {
    const messagesQuery = query(
      this.getMessagesRef(),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const unsubscribe = onValue(messagesQuery, callback, onError);
    return unsubscribe;
  }

  async sendMessage(messageData: MessageData): Promise<void> {
    await push(this.getMessagesRef(), messageData);
  }

  async updateReactions(messageId: string, reactions: Reaction[]): Promise<void> {
    await update(ref(db, `messages/${messageId}`), { reactions });
  }

  async setPresence(userId: string, data: any): Promise<void> {
    const presenceRef = this.getPresenceRef(userId);
    await set(presenceRef, data);
  }

  async removePresence(userId: string): Promise<void> {
    await remove(this.getPresenceRef(userId));
  }

  async setTypingStatus(userId: string, data: any): Promise<void> {
    const typingRef = this.getTypingRef(userId);
    await set(typingRef, data);
  }

  async removeTypingStatus(userId: string): Promise<void> {
    await remove(this.getTypingRef(userId));
  }

  setupDisconnectHandlers(userId: string): void {
    const presenceRef = this.getPresenceRef(userId);
    const typingRef = this.getTypingRef(userId);
    
    onDisconnect(presenceRef).remove();
    onDisconnect(typingRef).remove();
  }

  listenToPresence(
    callback: (snapshot: any) => void,
    onError?: (error: any) => void
  ): () => void {
    const presenceRef = ref(db, 'presence');
    const unsubscribe = onValue(presenceRef, callback, onError);
    return unsubscribe;
  }

  listenToTypingStatus(
    callback: (snapshot: any) => void,
    onError?: (error: any) => void
  ): () => void {
    const typingRef = ref(db, 'typing');
    const unsubscribe = onValue(typingRef, callback, onError);
    return unsubscribe;
  }

  getServerTimestamp(): any {
    return serverTimestamp();
  }
}

export const dbService = DatabaseService.getInstance();
