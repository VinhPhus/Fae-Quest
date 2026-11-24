import { ChillyTrack } from '../types';

const DB_NAME = 'faequest_chilly_healing_db';
const DB_VERSION = 1;
const STORE_PIXEL_ART = 'pixel_art';
const STORE_TRACKS = 'tracks';
const STORE_SETTINGS = 'settings';

const CUSTOM_ART_KEY = 'custom_default_art';

function openChillyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PIXEL_ART)) {
        db.createObjectStore(STORE_PIXEL_ART, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open database'));
  });
}

/**
 * Lưu tệp ảnh Pixel Art tùy chỉnh của người dùng vào IndexedDB
 */
export async function saveCustomPixelArtBlob(file: Blob | File): Promise<string> {
  const db = await openChillyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PIXEL_ART, 'readwrite');
    const store = tx.objectStore(STORE_PIXEL_ART);
    const record = {
      key: CUSTOM_ART_KEY,
      blob: file,
      type: file.type || 'image/png',
      updatedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => {
      const url = URL.createObjectURL(file);
      resolve(url);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Đọc ảnh Pixel Art tùy chỉnh từ IndexedDB
 */
export async function getCustomPixelArtBlob(): Promise<{ blob: Blob; url: string } | null> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PIXEL_ART, 'readonly');
      const store = tx.objectStore(STORE_PIXEL_ART);
      const req = store.get(CUSTOM_ART_KEY);
      req.onsuccess = () => {
        const record = req.result;
        if (record && record.blob) {
          const url = URL.createObjectURL(record.blob);
          resolve({ blob: record.blob, url });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi đọc ảnh pixel art từ IndexedDB:', err);
    return null;
  }
}

/**
 * Xóa ảnh Pixel Art tùy chỉnh
 */
export async function removeCustomPixelArtBlob(): Promise<void> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PIXEL_ART, 'readwrite');
      const store = tx.objectStore(STORE_PIXEL_ART);
      const req = store.delete(CUSTOM_ART_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi xóa ảnh pixel art:', err);
  }
}

/**
 * Lưu danh sách file nhạc người dùng tải từ máy vào IndexedDB
 */
export async function saveCustomTrackFiles(files: File[]): Promise<ChillyTrack[]> {
  const db = await openChillyDB();
  const savedTracks: ChillyTrack[] = [];

  for (const file of files) {
    const id = `track_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Bài hát không tên';

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const record = {
        id,
        title: cleanName,
        artist: 'Cá nhân',
        blob: file,
        mimeType: file.type || 'audio/mpeg',
        addedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => {
        const objectUrl = URL.createObjectURL(file);
        savedTracks.push({
          id,
          title: cleanName,
          artist: 'Thư viện của bạn',
          src: objectUrl,
          blobId: id,
          addedAt: record.addedAt,
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  return savedTracks;
}

/**
 * Lưu bài hát dạng Link URL bên ngoài
 */
export async function saveCustomUrlTrack(title: string, artist: string, url: string): Promise<ChillyTrack> {
  const db = await openChillyDB();
  const id = `track_url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = title.trim() || 'Nhạc Trực Tuyến';
  const cleanArtist = artist.trim() || 'Fae Stream';

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TRACKS, 'readwrite');
    const store = tx.objectStore(STORE_TRACKS);
    const record = {
      id,
      title: cleanTitle,
      artist: cleanArtist,
      url: url.trim(),
      addedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return {
    id,
    title: cleanTitle,
    artist: cleanArtist,
    src: url.trim(),
    addedAt: Date.now(),
  };
}

/**
 * Đọc tất cả bài hát lưu trữ trong IndexedDB
 */
export async function getAllStoredTracks(): Promise<ChillyTrack[]> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        const tracks: ChillyTrack[] = records.map((rec: any) => {
          let src = rec.url;
          if (rec.blob) {
            src = URL.createObjectURL(rec.blob);
          }
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist || 'Cá nhân',
            src,
            blobId: rec.blob ? rec.id : undefined,
            coverUrl: rec.coverUrl,
            addedAt: rec.addedAt || 0,
          };
        });
        resolve(tracks);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi đọc danh sách nhạc từ IndexedDB:', err);
    return [];
  }
}

/**
 * Xóa một bài hát theo ID
 */
export async function deleteStoredTrack(id: string): Promise<void> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi xóa bài hát khỏi IndexedDB:', err);
  }
}

/**
 * Lưu cài đặt cá nhân (cảnh đã chọn, v.v.)
 */
export async function saveChillySetting(key: string, value: any): Promise<void> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi lưu cài đặt Chilly:', err);
  }
}

/**
 * Lấy cài đặt cá nhân
 */
export async function getChillySetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}
