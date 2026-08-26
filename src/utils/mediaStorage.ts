// IndexedDB helper for local video & image blob persistence

const DB_NAME = 'ViralVideoMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

interface MediaRecord {
  id: string;
  blob: Blob;
  type: 'video' | 'image';
  mimeType: string;
  name: string;
  size: number;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaBlob(id: string, file: Blob, type: 'video' | 'image', name = ''): Promise<string> {
  try {
    const db = await openDB();
    const record: MediaRecord = {
      id,
      blob: file,
      type,
      mimeType: file.type,
      name: name || `${type}_${Date.now()}`,
      size: file.size,
      createdAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => {
        // Return object URL for immediate consumption
        const url = URL.createObjectURL(file);
        resolve(url);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback: create object URL directly
    return URL.createObjectURL(file);
  }
}

export async function getMediaBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result as MediaRecord | undefined;
        if (record && record.blob) {
          resolve(URL.createObjectURL(record.blob));
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

export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch {
    // ignore
  }
}

// Revive expired blob URLs for all uploaded gallery videos
export async function reviveVideosBlobUrls<T extends { id: string; videoUrl: string; blobId?: string }>(
  videos: T[]
): Promise<T[]> {
  try {
    const updated = await Promise.all(
      videos.map(async (v) => {
        if (v.blobId) {
          const freshUrl = await getMediaBlobUrl(v.blobId);
          if (freshUrl) {
            return { ...v, videoUrl: freshUrl };
          }
        }
        return v;
      })
    );
    return updated;
  } catch (error) {
    console.warn('Failed to revive video blobs', error);
    return videos;
  }
}

// Capture frame from a video file as a thumbnail image URL
export function generateVideoThumbnail(videoFile: File): Promise<{ thumbnailUrl: string; duration: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek to 1 second or 25% for a nice snapshot
      const targetSec = Math.min(1.5, video.duration / 2);
      video.currentTime = targetSec;

      const mins = Math.floor(video.duration / 60);
      const secs = Math.floor(video.duration % 60);
      const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ thumbnailUrl, duration: formattedDuration });
          } else {
            resolve({ thumbnailUrl: '', duration: formattedDuration });
          }
        } catch {
          resolve({ thumbnailUrl: '', duration: formattedDuration });
        } finally {
          URL.revokeObjectURL(videoUrl);
        }
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('ভিডিও ফাইলটি রিড করতে সমস্যা হয়েছে।'));
    };
  });
}

// Convert image file to base64 Data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
