import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { purgeLegacySensitiveLocalStorage, lockGlobalWindowVariables } from './utils/securityManager';

// Tự động kích hoạt PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Dọn sạch mọi key dữ liệu nhạy cảm cũ trong LocalStorage & khóa biến window
purgeLegacySensitiveLocalStorage();
lockGlobalWindowVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
