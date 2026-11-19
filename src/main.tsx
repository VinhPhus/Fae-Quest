import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { purgeLegacySensitiveLocalStorage, lockGlobalWindowVariables } from './utils/securityManager';

// Cơ chế tự động cập nhật PWA & Auto-Reload chống kẹt cache cho iOS & Desktop
let refreshing = false;

if ('serviceWorker' in navigator) {
  // Lắng nghe khi có Service Worker mới chiếm quyền điều khiển -> tự động reload an toàn đúng 1 lần
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Ép cập nhật ngay khi phát hiện phiên bản mới
      updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Tự động kiểm tra cập nhật mỗi khi user mở lại app (đặc biệt hữu ích cho iOS PWA khi mở lại từ Home Screen)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        // Định kỳ kiểm tra cập nhật mỗi 30 phút
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      }
    },
  });
}

// Dọn sạch mọi key dữ liệu nhạy cảm cũ trong LocalStorage & khóa biến window
purgeLegacySensitiveLocalStorage();
lockGlobalWindowVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
