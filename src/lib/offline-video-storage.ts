const DB_NAME = "smartlife-videos-v1";
const STORE_VIDEO = "videos";
const DB_VERSION = 1;

interface OfflineVideo {
  id: string;
  title: string;
  data: ArrayBuffer;
  savedAt: number;
  size: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VIDEO)) {
        db.createObjectStore(STORE_VIDEO, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoOffline(
  id: string,
  title: string,
  data: ArrayBuffer
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEO, "readwrite");
    const entry: OfflineVideo = { id, title, data, savedAt: Date.now(), size: data.byteLength };
    tx.objectStore(STORE_VIDEO).put(entry);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getVideoOffline(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEO, "readonly");
    const req = tx.objectStore(STORE_VIDEO).get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as OfflineVideo | undefined)?.data ?? null);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteVideoOffline(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEO, "readwrite");
    tx.objectStore(STORE_VIDEO).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function listOfflineVideos(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEO, "readonly");
    const req = tx.objectStore(STORE_VIDEO).getAllKeys();
    req.onsuccess = () => { db.close(); resolve(req.result as string[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getVideoStorageSize(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEO, "readonly");
    const req = tx.objectStore(STORE_VIDEO).getAll();
    req.onsuccess = () => {
      db.close();
      const total = (req.result as OfflineVideo[]).reduce((sum, v) => sum + v.size, 0);
      resolve(total);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
