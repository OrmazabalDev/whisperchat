import { useEffect, useRef, useCallback, useState } from 'react';
import { dbService } from '../services/db.service';
import { useAuthContext } from '../contexts/AuthContext';

const TYPING_DEBOUNCE_MS = 500;
const TYPING_TIMEOUT_MS = 3000;

export function useTypingStatus() {
  const { user, nickname } = useAuthContext();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const previousUsersRef = useRef<string[]>([]);

  // Setup typing listener
  useEffect(() => {
    if (!user) {
      setTypingUsers([]);
      previousUsersRef.current = [];
      return;
    }

    const handleTypingChange = (snapshot: any) => {
      const typing = snapshot.val();
      
      if (!typing) {
        if (previousUsersRef.current.length > 0) {
          setTypingUsers([]);
          previousUsersRef.current = [];
        }
        return;
      }

      const now = Date.now();
      const activeTypers = Object.entries(typing)
        .filter(([sessionId, data]: [string, any]) => 
          sessionId !== user.uid && 
          data?.nickname && 
          data?.timestamp && 
          (now - data.timestamp) < TYPING_TIMEOUT_MS
        )
        .map(([, data]: [string, any]) => data.nickname);

      // Only update if list changed
      const hasChanged = activeTypers.length !== previousUsersRef.current.length ||
        activeTypers.some((u, idx) => u !== previousUsersRef.current[idx]);

      if (hasChanged) {
        setTypingUsers(activeTypers);
        previousUsersRef.current = activeTypers;
      }
    };

    const unsubscribe = dbService.listenToTypingStatus(handleTypingChange);

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (user) {
        dbService.removeTypingStatus(user.uid).catch(() => {});
      }
    };
  }, [user]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!user || !nickname) return;

    // Debouncing: avoid multiple rapid writes
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      if (isTyping && !isTypingRef.current) {
        isTypingRef.current = true;
        dbService.setTypingStatus(user.uid, { 
          nickname, 
          timestamp: Date.now() 
        }).catch(() => {});
        
        typingTimeoutRef.current = setTimeout(() => {
          dbService.removeTypingStatus(user.uid).catch(() => {});
          isTypingRef.current = false;
        }, TYPING_TIMEOUT_MS);
      } else if (!isTyping && isTypingRef.current) {
        dbService.removeTypingStatus(user.uid).catch(() => {});
        isTypingRef.current = false;
      }
    }, TYPING_DEBOUNCE_MS);
  }, [user, nickname]);

  return { 
    typingUsers, 
    setTyping 
  };
}
