// Persistent IndexedDB Storage for High-Resolution Custom Images & Live Video Wallpapers

export interface CustomWallpaperRecord {
  id: string;
  name: string;
  type: 'image' | 'video';
  mimeType: string;
  blob: Blob;
  dataUrl?: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  createdAt: number;
  size: number;
}

const DB_NAME = 'ai_wallpaper_db';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

/**
 * Extract video metadata such as duration and dimensions
 */
export async function getVideoMetadata(blob: Blob): Promise<{ duration: number; width: number; height: number; thumbnail: string }> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const url = URL.createObjectURL(blob);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      const handleCapture = () => {
        let thumbnail = '';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 360;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnail = canvas.toDataURL('image/jpeg', 0.75);
          }
        } catch {
          // ignore canvas extraction error
        }

        const duration = video.duration || 0;
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        cleanup();
        resolve({ duration, width, height, thumbnail });
      };

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, (video.duration || 1) / 3);
      };

      video.onseeked = handleCapture;

      video.onerror = () => {
        cleanup();
        resolve({ duration: 0, width: 0, height: 0, thumbnail: '' });
      };

      setTimeout(() => {
        cleanup();
        resolve({ duration: 0, width: 0, height: 0, thumbnail: '' });
      }, 3500);
    } catch {
      resolve({ duration: 0, width: 0, height: 0, thumbnail: '' });
    }
  });
}

/**
 * Capture a lightweight preview thumbnail from a video Blob
 */
export async function generateVideoThumbnail(blob: Blob): Promise<string> {
  const meta = await getVideoMetadata(blob);
  return meta.thumbnail;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWallpaperBlob(
  id: string,
  blob: Blob,
  type: 'image' | 'video',
  name: string,
  customThumbnail?: string
): Promise<string> {
  try {
    let thumbnail = customThumbnail || '';
    let duration = 0;
    let width = 0;
    let height = 0;

    if (type === 'video') {
      try {
        const meta = await getVideoMetadata(blob);
        thumbnail = thumbnail || meta.thumbnail;
        duration = meta.duration;
        width = meta.width;
        height = meta.height;
      } catch {
        thumbnail = '';
      }
    }

    const db = await openDB();
    const record: CustomWallpaperRecord = {
      id,
      name,
      type,
      mimeType: blob.type,
      blob,
      thumbnail,
      duration,
      width,
      height,
      createdAt: Date.now(),
      size: blob.size,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to object URL:', err);
    return URL.createObjectURL(blob);
  }
}

export async function getWallpaperRecord(id: string): Promise<CustomWallpaperRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result as CustomWallpaperRecord | undefined;
        resolve(record || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function getWallpaperBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result as CustomWallpaperRecord | undefined;
        if (record && record.blob) {
          resolve(URL.createObjectURL(record.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function getAllCustomWallpapers(): Promise<CustomWallpaperRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as CustomWallpaperRecord[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteCustomWallpaper(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete wallpaper from IndexedDB:', err);
  }
}
