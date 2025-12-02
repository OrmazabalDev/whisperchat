/**
 * AuthContext - Manage user authentication state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: { uid: string } | null;
  loading: boolean;
  error: string | null;
  nickname: string;
  signInAnonymous: (nickname?: string) => Promise<void>;
  setNickname: (nickname: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState<string>('');

  useEffect(() => {
    // Get session ID on mount
    const sessionId = authService.getSessionId();
    const storedNickname = authService.getUserNickname();
    
    setUser({ uid: sessionId });
    setNicknameState(storedNickname);
    setLoading(false);
  }, []);

  const signInAnonymous = async (newNickname?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (newNickname) {
        authService.setUserNickname(newNickname);
        setNicknameState(newNickname);
      }

      const sessionId = authService.getSessionId();
      setUser({ uid: sessionId });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setNickname = (newNickname: string): void => {
    authService.setUserNickname(newNickname);
    setNicknameState(newNickname);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        nickname, 
        signInAnonymous, 
        setNickname 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
