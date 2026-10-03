import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/global.css';
import './ui/terminal/terminal.css';
import './styles/signal-investigation.css';
import './styles/packet-voiceprint.css';
import './styles/causal-transmission.css';

const root = document.getElementById('root');

if (!root) throw new Error('Application root was not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
