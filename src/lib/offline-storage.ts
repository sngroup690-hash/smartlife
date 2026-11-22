const DB_NAME = "smartlife-offline-v1";
const STORE_PDF = "pdfs";
const DB_VERSION = 1;

interface OfflinePdf {
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
      if (!db.objectStoreNames.contains(STORE_PDF)) {
        db.createObjectStore(STORE_PDF, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePdfOffline(
  id: string,
  title: string,
  data: ArrayBuffer
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PDF, "readwrite");
    const entry: OfflinePdf = { id, title, data, savedAt: Date.now(), size: data.byteLength };
    tx.objectStore(STORE_PDF).put(entry);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPdfOffline(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PDF, "readonly");
    const req = tx.objectStore(STORE_PDF).get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as OfflinePdf | undefined)?.data ?? null);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deletePdfOffline(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PDF, "readwrite");
    tx.objectStore(STORE_PDF).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function listOfflinePdfs(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PDF, "readonly");
    const req = tx.objectStore(STORE_PDF).getAllKeys();
    req.onsuccess = () => { db.close(); resolve(req.result as string[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
