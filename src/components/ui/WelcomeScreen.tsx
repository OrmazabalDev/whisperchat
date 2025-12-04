import { useState } from 'react';
import { isValidNickname } from '../../utils';
import { Terminal, Shield, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onJoinChat: (nickname: string) => Promise<void>;
  loading: boolean;
}

const WelcomeScreen = ({ onJoinChat, loading }: WelcomeScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    
    if (trimmed && !isValidNickname(trimmed)) {
      setError('Nickname: 1-20 characters (letters, numbers, spaces, - or _)');
      return;
    }

    setError('');
    onJoinChat(trimmed).catch(() => setError('Failed to join'));
  };

  return (
    <div className="welcome-screen">
      {/* Efecto de líneas de escaneo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scan-line" style={{ top: 0, background: 'oklch(0.75 0.2 145 / 0.2)' }} />
        <div className="scan-line" style={{ top: '33.333%', background: 'oklch(0.75 0.2 145 / 0.2)', animationDelay: '1s' }} />
        <div className="scan-line" style={{ top: '66.666%', background: 'oklch(0.75 0.2 145 / 0.2)', animationDelay: '2s' }} />
      </div>

      <div className="welcome-card">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <Terminal className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
          </div>
          <h1 className="welcome-title glitch-text" style={{ fontSize: '2.5rem' }}>DarkWhisper</h1>
        </div>
        <p className="welcome-subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {'>'} Encrypted · Anonymous · Ephemeral
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }} className="welcome-info-grid">
          <div className="info-box" role="list" style={{ padding: '1.5rem', background: 'rgba(0, 255, 136, 0.05)', borderColor: 'rgba(0, 255, 136, 0.3)' }}>
            <h3 style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {'>'} Features
            </h3>
            <p role="listitem" className="flex items-center gap-2" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} /> 
              <span>End-to-End Encrypted (E2E) - Firebase cannot read messages</span>
            </p>
            <p role="listitem" className="flex items-center gap-2" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <Terminal className="w-4 h-4" style={{ color: 'var(--secondary)', flexShrink: 0 }} /> 
              <span>Auto-delete: All messages erased every 120 seconds</span>
            </p>
            <p role="listitem" className="flex items-center gap-2" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} /> 
              <span>Private DMs with encryption - Use /dm username</span>
            </p>
            <p role="listitem" className="flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} /> 
              <span>No registration - 100% anonymous - No data stored</span>
            </p>
          </div>
          
          <div className="info-box" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--destructive)' }}>
            <h3 style={{ color: 'var(--destructive)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {'>'} Disclaimer & Terms
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              This platform is provided "AS IS" for educational and communication purposes only. 
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              {'>'} You are solely responsible for your content and actions.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              {'>'} The owner/operator is NOT responsible for user-generated content.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
              {'>'} Illegal activities are prohibited. By using this service, you agree to these terms.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="nickname-form" noValidate>
          <div className="form-group">
            <label htmlFor="nickname" style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              {'>'} Choose a nickname (optional)
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="Leave empty for random ID..."
              maxLength={20}
              disabled={loading}
              className="nickname-input"
              autoComplete="off"
              autoFocus
            />
            {error && <span className="error-message" role="alert" style={{ color: 'var(--destructive)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>{error}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="join-button"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 0 20px var(--primary)',
              opacity: 0.6
            }}
          >
            {loading ? '⟳ CONNECTING...' : '⚡ JOIN CHAT'}
          </button>
        </form>

        <div className="text-center text-xs font-mono" style={{ marginTop: '1.5rem', color: 'var(--muted-foreground)' }}>
          <p style={{ color: 'var(--warning)', fontWeight: 600 }}>{'>'} By clicking "JOIN CHAT" you accept all terms above</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
