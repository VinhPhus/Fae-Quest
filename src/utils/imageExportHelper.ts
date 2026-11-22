/**
 * Helper to convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize and compress Blob to Data URL.
 * Prevents massive 5MB-10MB mobile camera/Unsplash photos from choking WebKit/Safari
 * memory buffers during html-to-image <foreignObject> rasterization.
 */
function compressBlobToDataUrl(blob: Blob, maxDim = 1080): Promise<string> {
  return new Promise<string>((resolve) => {
    if (blob.type === 'image/svg+xml') {
      blobToDataUrl(blob).then(resolve);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawData = reader.result;
      if (typeof rawData !== 'string') {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width || 400;
          let height = img.naturalHeight || img.height || 400;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawData);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressed || rawData);
        } catch {
          resolve(rawData);
        }
      };
      img.onerror = () => resolve(rawData);
      img.src = rawData;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

/**
 * High-definition Dark Fantasy SVG Background (Data URL).
 * 100% offline, guaranteed zero-delay, zero-CORS fallback.
 */
export const DEFAULT_DARK_FANTASY_COVER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 440" width="540" height="440">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#040D12"/>
      <stop offset="35%" stop-color="#0A1E29"/>
      <stop offset="70%" stop-color="#112836"/>
      <stop offset="100%" stop-color="#06141B"/>
    </linearGradient>
    <radialGradient id="moonGlow" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35"/>
      <stop offset="45%" stop-color="#F59E0B" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#06141B" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mtnGrad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#152834" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#06141B" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="mtnGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F202B"/>
      <stop offset="100%" stop-color="#06141B"/>
    </linearGradient>
  </defs>
  <!-- Sky background -->
  <rect width="540" height="440" fill="url(#skyGrad)"/>
  <!-- Ambient glow in center -->
  <circle cx="270" cy="160" r="220" fill="url(#moonGlow)"/>

  <!-- Distant mountain peaks -->
  <polygon points="0,320 85,210 170,290 270,165 370,285 455,215 540,310 540,440 0,440" fill="url(#mtnGrad1)"/>
  <!-- Closer jagged peaks -->
  <polygon points="0,380 110,270 210,340 315,240 430,350 540,280 540,440 0,440" fill="url(#mtnGrad2)"/>

  <!-- Subtle castle tower silhouette in center -->
  <rect x="256" y="150" width="28" height="90" fill="#07131A"/>
  <polygon points="252,150 270,120 288,150" fill="#07131A"/>
  <rect x="242" y="180" width="16" height="60" fill="#08151D"/>
  <polygon points="239,180 250,160 261,180" fill="#08151D"/>
  <rect x="282" y="180" width="16" height="60" fill="#08151D"/>
  <polygon points="279,180 290,160 301,180" fill="#08151D"/>

  <!-- Stars / Embers -->
  <circle cx="75" cy="80" r="1.5" fill="#FDE68A" opacity="0.6"/>
  <circle cx="140" cy="50" r="1.2" fill="#FDE68A" opacity="0.5"/>
  <circle cx="210" cy="95" r="1.5" fill="#FDE68A" opacity="0.7"/>
  <circle cx="340" cy="65" r="1.8" fill="#FDE68A" opacity="0.8"/>
  <circle cx="420" cy="90" r="1.2" fill="#FDE68A" opacity="0.5"/>
  <circle cx="485" cy="55" r="1.5" fill="#FDE68A" opacity="0.6"/>
</svg>
`)}`;

/**
 * Extract Base64 directly from an already loaded DOM <img> element.
 * 0ms latency, zero network calls.
 */
export function getElementImageBase64(imgEl: HTMLImageElement | null): string {
  if (!imgEl || !imgEl.complete || !imgEl.naturalWidth || !imgEl.naturalHeight) return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(imgEl.naturalWidth, 1200);
    canvas.height = Math.min(imgEl.naturalHeight, 800);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return dataUrl && dataUrl.startsWith('data:image') ? dataUrl : '';
  } catch {
    return '';
  }
}

/**
 * Image helper for safely converting image URLs (local, remote or data URLs)
 * into Base64 data strings before capturing with html-to-image.
 * Guaranteed zero CORS / tainted canvas issues.
 */
export async function imageUrlToBase64(
  url: string,
  domSelector?: string,
  maxDim = 1080
): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;

  // Make relative URLs absolute
  let targetUrl = url;
  if (typeof window !== 'undefined' && url.startsWith('/')) {
    targetUrl = window.location.origin + url;
  }

  const isRemote = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');

  // 1. Direct fetch without cache-buster (fastest & standard for Cloudinary / modern CDNs)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(targetUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const blob = await res.blob();
      const base64 = await compressBlobToDataUrl(blob, maxDim);
      if (base64) return base64;
    }
  } catch {
    // Continue to next method
  }

  // 2. Fetch with cache-buster to bypass stale tainted browser cache
  if (isRemote) {
    try {
      const sep = targetUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${targetUrl}${sep}_cors_cb=${Date.now()}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(fetchUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const blob = await res.blob();
        const base64 = await compressBlobToDataUrl(blob, maxDim);
        if (base64) return base64;
      }
    } catch {
      // Continue to canvas fallback
    }
  }

  // 3. Fallback to Image loading via Canvas with anonymous crossOrigin
  try {
    const canvasRes = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve('');
      }, 3500);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          let w = img.naturalWidth || img.width || 400;
          let h = img.naturalHeight || img.height || 400;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch {
          resolve('');
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve('');
      };

      const sep = targetUrl.includes('?') ? '&' : '?';
      img.src = `${targetUrl}${sep}_img_cb=${Date.now()}`;
    });

    if (canvasRes) return canvasRes;
  } catch {
    // Continue to proxy
  }

  // 4. Fallback for remote URLs: Multi-layer CORS proxy
  if (isRemote) {
    // Layer 1: images.weserv.nl
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}&output=jpg&q=82&w=${Math.min(maxDim, 1080)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(proxyUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const blob = await res.blob();
        const base64 = await compressBlobToDataUrl(blob, maxDim);
        if (base64) return base64;
      }
    } catch {
      // Continue to layer 2
    }

    // Layer 2: corsproxy.io
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(proxyUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const blob = await res.blob();
        const base64 = await compressBlobToDataUrl(blob, maxDim);
        if (base64) return base64;
      }
    } catch {
      // Continue to DOM extraction
    }
  }

  // 5. Try extracting from an existing DOM element if selector provided
  if (typeof document !== 'undefined' && domSelector) {
    try {
      const el = document.querySelector<HTMLImageElement>(domSelector);
      const b64 = getElementImageBase64(el);
      if (b64) return b64;
    } catch {
      // End of attempts
    }
  }

  return '';
}

/**
 * Ensure all <img> elements inside a container are fully loaded and decoded.
 * Uses HTMLImageElement.prototype.decode() to force WebKit/Safari to compile
 * raster textures into GPU cache before html-to-image foreignObject capture.
 */
export async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          const onDone = () => {
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
            resolve();
          };
          img.addEventListener('load', onDone);
          img.addEventListener('error', onDone);
          setTimeout(onDone, 500);
        });
      }
      // Explicitly decode image texture into GPU memory
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // ignore decode errors
        }
      }
    })
  );
  // Micro-delay for WebKit GPU texture commitment
  await new Promise((r) => setTimeout(r, 60));
}

/**
 * Convert a base64 data URL to a File object for navigator.share
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
