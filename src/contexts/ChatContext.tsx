import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Message, Reaction } from '../types';
import { dbService } from '../services/db.service';
import { cryptoService } from '../services/crypto.service';
import { useCryptoContext } from './CryptoContext';
import { useAuthContext } from './AuthContext';

interface ChatContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  activeUsers: number;
  sendMessage: (text: string, fileData?: any) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  const { encryptionKey, decryptMessage } = useCryptoContext();
  const { user, nickname } = useAuthContext();

  // Listen to messages
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = dbService.listenToMessages(
      async (snapshot) => {
        const messageList: Message[] = [];
        const snapshotVal = snapshot.val();
        
        if (snapshotVal) {
          for (const [key, data] of Object.entries(snapshotVal)) {
            const msg = data as any;
            let displayText = '🔒 [Encrypted]';
            
            if (msg.encrypted && msg.encryptedContent && encryptionKey) {
              try {
                displayText = await decryptMessage(msg.encryptedContent);
              } catch {
                displayText = '🔒 [Unable to decrypt]';
              }
            } else if (msg.encrypted && !encryptionKey) {
              displayText = '🔒 [Encryption key not available]';
            } else if (!msg.encrypted) {
              displayText = msg.text || '[Empty message]';
            }
            
            // Decrypt filename if exists
            let decryptedFileName = msg.fileName;
            if (msg.encryptedFileName && encryptionKey) {
              try {
                decryptedFileName = await decryptMessage(msg.encryptedFileName);
              } catch {
                decryptedFileName = '🔒 [Encrypted file]';
              }
            }
            
            messageList.push({
              id: key,
              text: displayText,
              nickname: msg.nickname,
              userId: msg.sessionId || msg.userId,
              timestamp: msg.timestamp,
              createdAt: new Date(msg.timestamp),
              encrypted: msg.encrypted || false,
              encryptedContent: msg.encryptedContent,
              reactions: msg.reactions || [],
              fileUrl: msg.fileUrl,
              fileName: decryptedFileName,
              fileType: msg.fileType,
              fileSize: msg.fileSize,
              encryptedFile: msg.encryptedFile,
            });
          }
        }

        setMessages(messageList);
        setLoading(false);
        setError(null);
      },
      (err: any) => {
        const errorMessage = err.code === 'PERMISSION_DENIED'
          ? 'Failed to load messages. Check Firebase rules.'
          : 'Failed to load messages. Check connection.';
        setError(errorMessage);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, encryptionKey, decryptMessage]);

  // Listen to presence
  useEffect(() => {
    if (!user) return;

    const unsubscribe = dbService.listenToPresence(
      (snapshot) => {
        const presence = snapshot.val();
        if (presence) {
          const count = Object.values(presence).filter(
            (p: any) => p.online && Date.now() - p.lastSeen < 30000
          ).length;
          setActiveUsers(count);
        } else {
          setActiveUsers(0);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sendMessage = useCallback(async (text: string, fileData?: any): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    if (!text?.trim() && !fileData) throw new Error('Message or file required');
    if (!encryptionKey) throw new Error('Encryption not available');

    try {
      const trimmed = text.trim();
      const encryptedContent = await cryptoService.encryptMessage(trimmed, encryptionKey);
      let encryptedFileName: string | undefined;
      
      if (fileData) {
        encryptedFileName = await cryptoService.encryptMessage(fileData.fileName, encryptionKey);
      }
      
      const messageData: any = {
        text: '🔒',
        nickname,
        sessionId: user.uid,
        timestamp: Date.now(),
        createdAt: dbService.getServerTimestamp(),
        encrypted: true,
        encryptedContent,
      };

      // Add file data if exists
      if (fileData && encryptedFileName) {
        messageData.fileUrl = fileData.url;
        messageData.fileName = '🔒';
        messageData.encryptedFileName = encryptedFileName;
        messageData.fileType = fileData.fileType;
        messageData.fileSize = fileData.fileSize;
        messageData.storagePath = fileData.storagePath;
        messageData.encryptedFile = true;
      }

      await dbService.sendMessage(messageData);
    } catch {
      throw new Error('Failed to send message');
    }
  }, [user, nickname, encryptionKey]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const message = messages.find((m: Message) => m.id === messageId);
      if (!message) throw new Error('Message not found');
      
      const reactions = message.reactions || [];
      const existingReaction = reactions.find((r: Reaction) => r.emoji === emoji);
      
      let updatedReactions: Reaction[];
      
      if (existingReaction) {
        const hasUserReacted = existingReaction.users.includes(nickname);
        
        if (hasUserReacted) {
          // Remove reaction
          updatedReactions = reactions
            .map((r: Reaction) => r.emoji === emoji 
              ? { ...r, count: r.count - 1, users: r.users.filter((u: string) => u !== nickname) }
              : r
            )
            .filter((r: Reaction) => r.count > 0);
        } else {
          // Add user to existing reaction
          updatedReactions = reactions.map((r: Reaction) => r.emoji === emoji 
            ? { ...r, count: r.count + 1, users: [...r.users, nickname] }
            : r
          );
        }
      } else {
        // Create new reaction
        updatedReactions = [...reactions, { emoji, count: 1, users: [nickname] }];
      }
      
      await dbService.updateReactions(messageId, updatedReactions);
    } catch {
      throw new Error('Failed to add reaction');
    }
  }, [user, nickname, messages]);

  return (
    <ChatContext.Provider 
      value={{ 
        messages, 
        loading, 
        error, 
        activeUsers,
        sendMessage, 
        addReaction 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
