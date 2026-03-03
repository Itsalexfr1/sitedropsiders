import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/article-premium.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER";

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
