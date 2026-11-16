import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { purgeLegacySensitiveLocalStorage, lockGlobalWindowVariables } from './utils/securityManager';

// Dọn sạch mọi key dữ liệu nhạy cảm cũ trong LocalStorage & khóa biến window
purgeLegacySensitiveLocalStorage();
lockGlobalWindowVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
