import { createRoot } from 'react-dom/client'
// Force cache refresh after build fixes
(window as any).APP_VERSION = '2.2.0-' + new Date().getTime();
import './index.css'
import './styles/article-premium.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "160350942941-s68rjkhbs57l04jool8lbj1a0qdcblge.apps.googleusercontent.com";

import { ThemeProvider } from './context/ThemeContext'

// --- MOBILE OAUTH INTERCEPTOR ---
// Execute immediately before React or Router boots up to guarantee the hash is not lost
if (window.location.hash.includes('access_token=')) {
    try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
            localStorage.setItem('dropsiders_google_mobile_token', accessToken);
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
    } catch(e) {}
}

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </GoogleOAuthProvider>
)
