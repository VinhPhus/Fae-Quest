import { ChillyTrack } from '../types';
import { uploadAudioToCloudinary } from './cloudinaryUpload';

const DB_NAME = 'faequest_chilly_healing_db';
const DB_VERSION = 1;
const STORE_PIXEL_ART = 'pixel_art';
const STORE_TRACKS = 'tracks';
const STORE_SETTINGS = 'settings';

const CUSTOM_ART_KEY = 'custom_default_art';

// Cache URL.createObjectURL theo track ID để tránh tạo blob URL mới mỗi lần đồng bộ lại danh sách
const blobObjectUrlCache = new Map<string, { size: number; type: string; url: string }>();

function getOrCreateCachedBlobUrl(trackId: string, blob: Blob): string {
  const cached = blobObjectUrlCache.get(trackId);
  if (cached && cached.size === blob.size && cached.type === blob.type) {
    return cached.url;
  }
  if (cached) {
    try {
      URL.revokeObjectURL(cached.url);
    } catch {}
  }
  const url = URL.createObjectURL(blob);
  blobObjectUrlCache.set(trackId, { size: blob.size, type: blob.type, url });
  return url;
}

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
 * Lưu danh sách file nhạc người dùng tải từ máy vào IndexedDB + tải lên Cloudinary để đồng bộ đa thiết bị
 */
export async function saveCustomTrackFiles(files: File[]): Promise<ChillyTrack[]> {
  const db = await openChillyDB();
  const savedTracks: ChillyTrack[] = [];

  for (const file of files) {
    const id = `track_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Bài hát không tên';

    let cloudUrl: string | undefined;
    try {
      cloudUrl = await uploadAudioToCloudinary(file);
    } catch (err) {
      console.warn('Upload nhạc lên đám mây thất bại, tạm lưu ngoại tuyến trên máy:', err);
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const record = {
        id,
        title: cleanName,
        artist: 'Thư viện của bạn',
        blob: file,
        cloudUrl: cloudUrl || '',
        url: cloudUrl || '',
        sourceType: 'local',
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
          src: cloudUrl || objectUrl,
          cloudUrl,
          blobId: id,
          sourceType: 'local',
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
 * Đọc Blob gốc của một bài hát trong IndexedDB để đồng bộ lên đám mây nếu chưa có cloudUrl
 */
export async function getStoredTrackBlob(id: string): Promise<{ blob: Blob; title: string } | null> {
  try {
    const db = await openChillyDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.get(id);
      req.onsuccess = () => {
        const rec = req.result;
        if (rec && rec.blob) {
          resolve({ blob: rec.blob, title: rec.title || 'track' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Cập nhật cloudUrl cho bài hát đã lưu cục bộ
 */
export async function updateStoredTrackCloudUrl(id: string, cloudUrl: string): Promise<void> {
  try {
    const db = await openChillyDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result;
        if (!rec) {
          resolve();
          return;
        }
        rec.cloudUrl = cloudUrl;
        rec.url = cloudUrl;
        const putReq = store.put(rec);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Lỗi cập nhật cloudUrl cho bài hát:', err);
  }
}

/**
 * Đồng bộ danh sách từ đám mây vào IndexedDB (giữ lại blob cục bộ nếu trùng ID)
 */
export async function syncCloudTracksToIndexedDB(cloudTracks: ChillyTrack[]): Promise<ChillyTrack[]> {
  try {
    const db = await openChillyDB();
    const existingRecords: any[] = await new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const existingMap = new Map<string, any>(existingRecords.map((r) => [r.id, r]));
    const cloudIdSet = new Set(cloudTracks.map((t) => t.id));

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);

      // Xóa các bản ghi cũ đã bị xóa trên đám mây (trừ bản ghi cục bộ chưa tải lên xong)
      for (const oldRec of existingRecords) {
        if (!cloudIdSet.has(oldRec.id)) {
          const hasLocalOnlyBlob = Boolean(oldRec.blob && !oldRec.cloudUrl);
          if (!hasLocalOnlyBlob) {
            store.delete(oldRec.id);
          }
        }
      }

      // Ghi/cập nhật các bài từ đám mây
      for (const track of cloudTracks) {
        const prev = existingMap.get(track.id);
        store.put({
          id: track.id,
          title: track.title,
          artist: track.artist,
          src: track.src || track.cloudUrl || '',
          url: track.src || track.cloudUrl || '',
          cloudUrl: track.cloudUrl || (track.src?.startsWith('http') ? track.src : ''),
          coverUrl: track.coverUrl,
          sourceType: track.sourceType || (track.youtubeVideoId ? 'youtube' : 'url'),
          youtubeVideoId: track.youtubeVideoId,
          audiusTrackId: track.audiusTrackId,
          duration: track.duration,
          addedAt: track.addedAt || Date.now(),
          ...(prev?.blob ? { blob: prev.blob, mimeType: prev.mimeType } : {}),
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return getAllStoredTracks();
  } catch (err) {
    console.warn('Lỗi đồng bộ danh sách nhạc vào kho cục bộ:', err);
    return cloudTracks;
  }
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
 * Lưu một bài hát bất kỳ (Audius, YouTube, URL, Local) vào IndexedDB (giữ nguyên blob nếu đã có)
 */
export async function saveTrackToStorage(track: ChillyTrack): Promise<void> {
  const db = await openChillyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRACKS, 'readwrite');
    const store = tx.objectStore(STORE_TRACKS);
    const getReq = store.get(track.id);
    getReq.onsuccess = () => {
      const prev = getReq.result;
      const remoteUrl =
        track.cloudUrl ||
        (track.src && track.src.startsWith('http') ? track.src : '') ||
        prev?.cloudUrl ||
        '';
      const record = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        src: remoteUrl || track.src || '',
        url: remoteUrl || track.src || '',
        cloudUrl: remoteUrl,
        coverUrl: track.coverUrl,
        sourceType: track.sourceType || prev?.sourceType || 'url',
        youtubeVideoId: track.youtubeVideoId,
        audiusTrackId: track.audiusTrackId,
        duration: track.duration,
        addedAt: track.addedAt || prev?.addedAt || Date.now(),
        ...(prev?.blob ? { blob: prev.blob, mimeType: prev.mimeType } : {}),
      };
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
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
          const remoteUrl = rec.cloudUrl || (typeof rec.url === 'string' && rec.url.startsWith('http') ? rec.url : '') || (typeof rec.src === 'string' && rec.src.startsWith('http') ? rec.src : '');
          let src = remoteUrl || rec.src || rec.url;
          if (rec.blob) {
            src = getOrCreateCachedBlobUrl(rec.id, rec.blob);
          }
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist || 'Cá nhân',
            src,
            cloudUrl: remoteUrl || undefined,
            blobId: rec.blob ? rec.id : undefined,
            coverUrl: rec.coverUrl,
            sourceType: rec.sourceType || (rec.blob ? 'local' : rec.youtubeVideoId ? 'youtube' : 'url'),
            youtubeVideoId: rec.youtubeVideoId,
            audiusTrackId: rec.audiusTrackId,
            duration: rec.duration,
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
  const cached = blobObjectUrlCache.get(id);
  if (cached) {
    try {
      URL.revokeObjectURL(cached.url);
    } catch {}
    blobObjectUrlCache.delete(id);
  }
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
