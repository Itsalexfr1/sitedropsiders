import { createRoot } from 'react-dom/client'
// Force cache refresh after build fixes
(window as any).APP_VERSION = '2.2.0-' + new Date().getTime();
import './index.css'
import './styles/article-premium.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "762584383630-nc4f3eaqnvnkus7lk793n2n22qjdpdv3.apps.googleusercontent.com";

import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </GoogleOAuthProvider>
)
