import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider, CryptoProvider, ChatProvider } from './contexts'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CryptoProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </CryptoProvider>
  </AuthProvider>
)
