import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BlinkProvider } from '@blinkdotnew/react'
import App from './App'
import './index.css'

// Silence unhandled WebSocket & transient storage/database closing errors from external cloud SDKs
if (typeof window !== 'undefined') {
  const isIgnorableError = (msg: string, filename?: string) => {
    const lower = (msg || '').toLowerCase();
    const fileLower = (filename || '').toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('blink.new') ||
      lower.includes('database is closing') ||
      lower.includes('database is closing/hidden') ||
      lower.includes('database connection is closing') ||
      lower.includes('database is closed') ||
      lower.includes('failed to fetch') ||
      lower.includes('the database connection is closing') ||
      fileLower.includes('blink')
    );
  };

  window.addEventListener('error', (event) => {
    if (isIgnorableError(event.message || '', event.filename)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = typeof event.reason === 'string' 
      ? event.reason 
      : event.reason?.message || event.reason?.name || String(event.reason || '');
    if (isIgnorableError(reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Remove SDK branding badges from the DOM
const removeBadges = () => {
  document.querySelectorAll('body > *:not(#root)').forEach(el => {
    const text = el.textContent || '';
    if (
      text.includes('Made with Blink') ||
      text.includes('Made with Replit') ||
      el.querySelector?.('a[href*="blink.new"]') ||
      el.querySelector?.('a[href*="replit.com"]')
    ) {
      (el as HTMLElement).style.display = 'none';
    }
  });
};
const observer = new MutationObserver(removeBadges);
observer.observe(document.body, { childList: true, subtree: false });
removeBadges();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkProvider
      projectId={(import.meta as any).env?.VITE_BLINK_PROJECT_ID || 'perplexity-9xplge2w'}
      publishableKey={(import.meta as any).env?.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_dummy'}
    >
      <Toaster position="top-right" />
      <App />
    </BlinkProvider>
  </React.StrictMode>,
)
