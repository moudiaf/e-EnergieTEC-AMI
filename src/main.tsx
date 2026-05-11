import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker désactivé — Il interceptait les requêtes InsForge Auth
// et les redirigeait vers /api/login (inexistant sur Netlify).
// À réactiver uniquement après configuration correcte d'un vrai SW.

