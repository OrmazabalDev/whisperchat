import { useEffect, useState, useRef } from 'react';
import { dbService } from '../services/db.service';
import { useAuthContext } from '../contexts/AuthContext';

const PRESENCE_UPDATE_INTERVAL = 30000;

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, nickname } = useAuthContext();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const updatePresence = async () => {
      try {
        await dbService.setPresence(user.uid, {
          online: true,
          lastSeen: Date.now(),
          nickname
        });
      } catch {}
    };

    const setupPresence = async () => {
      try {
        await updatePresence();
        dbService.setupDisconnectHandlers(user.uid);
        setLoading(false);
        heartbeatIntervalRef.current = setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL);
      } catch {
        setLoading(false);
      }
    };

    setupPresence();

    const unsubscribe = dbService.listenToPresence((snapshot) => {
      const presences = snapshot.val();
      const count = presences 
        ? Object.values(presences).filter((presence: any) => presence?.online === true).length
        : 0;
      setOnlineCount(count);
    });

    return () => {
      unsubscribe();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      dbService.removePresence(user.uid).catch(() => {});
    };
  }, [user, nickname]);

  return { onlineCount, loading };
}
