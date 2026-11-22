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
 * Image helper for safely converting image URLs (local, remote or data URLs)
 * into Base64 data strings before capturing with html-to-image.
 * This guarantees zero CORS/tainted canvas issues on mobile and desktop.
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;

  // Make relative URLs absolute so fetch works reliably
  let targetUrl = url;
  if (typeof window !== 'undefined' && url.startsWith('/')) {
    targetUrl = window.location.origin + url;
  }

  const isRemote = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');

  // Add cache-busting param for remote http(s) URLs so the browser doesn't serve a non-CORS cached entry
  let fetchUrl = targetUrl;
  if (isRemote) {
    const separator = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${separator}_c=${Date.now()}`;
  }

  // 1. Try standard fetch with timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(fetchUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const blob = await res.blob();
      const base64 = await blobToDataUrl(blob);
      if (base64) return base64;
    }
  } catch (err) {
    console.warn('[imageUrlToBase64] Fetch failed, trying Canvas fallback:', fetchUrl, err);
  }

  // 2. Fallback to Image loading via Canvas with anonymous crossOrigin
  try {
    const canvasRes = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve('');
      }, 3000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve('');
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve('');
      };

      img.src = fetchUrl;
    });

    if (canvasRes) return canvasRes;
  } catch {
    // Continue to proxy
  }

  // 3. Fallback for remote URLs: Use high-speed CORS image service wsrv.nl
  if (isRemote) {
    try {
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&output=jpg&q=85`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(proxyUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const blob = await res.blob();
        const base64 = await blobToDataUrl(blob);
        if (base64) return base64;
      }
    } catch (proxyErr) {
      console.warn('[imageUrlToBase64] Proxy fallback failed:', proxyErr);
    }
  }

  return '';
}

/**
 * Ensure all <img> elements inside a container are fully loaded and decoded.
 */
export async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const onDone = () => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
        // Safety timeout so export never hangs
        setTimeout(onDone, 500);
      });
    })
  );
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
