import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if (import.meta.env.DEV) {
  // Dev-only hook so the visual states can be poked from the console /
  // automated screenshots without needing a live microphone.
  import('@/state/store').then(({ store }) => {
    (window as any).__debugStore = store;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
