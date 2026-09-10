"use client";

import type { LibrarySection } from "@/lib/librarySection";

const DB_NAME = "bunko-pwa";
const DB_VERSION = 1;
const VOLUMES = "volumes";
const PAGES = "pages";
const DOWNLOADS = "downloads";
const OPERATIONS = "operations";

export type OfflineDownloadStatus = "queued" | "downloading" | "ready" | "error";
export type OfflineOperationKind = "favorite" | "read" | "progress" | "series-favorite";

export interface OfflineVolume {
  id: string;
  userId: string;
  slug: string;
  section: LibrarySection;
  title: string;
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  isOneshot: boolean;
  mangaStyle: string | null;
  metadata: Record<string, unknown>;
  coverUrl: string | null;
  downloadedAt?: string;
  isRead: boolean;
  isFavorite: boolean;
  lastPage: number;
  totalPages: number;
}

export interface OfflineDownload {
  key: string;
  userId: string;
  volumeId: string;
  status: OfflineDownloadStatus;
  completedPages: number;
  totalPages: number;
  size: number;
  error?: string;
  updatedAt: string;
}

interface OfflinePage {
  key: string;
  userId: string;
  volumeId: string;
  index: number;
  blob: Blob;
}

export interface OfflineOperation {
  id: string;
  userId: string;
  kind: OfflineOperationKind;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface OfflineVolumeManifest {
  id: string;
  slug: string;
  section: LibrarySection;
  title: string;
  series: {
    id: string;
    slug: string;
    title: string;
    isOneshot: boolean;
  };
  mangaStyle: string | null;
  metadata: Record<string, unknown>;
  coverUrl: string | null;
  isRead: boolean;
  isFavorite: boolean;
  lastPage: number;
  totalPages: number;
}

function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function volumeKey(userId: string, volumeId: string) {
  return `${userId}:${volumeId}`;
}

function pageKey(userId: string, volumeId: string, index: number) {
  return `${userId}:${volumeId}:${index}`;
}

function downloadKey(userId: string, volumeId: string) {
  return `${userId}:${volumeId}`;
}

function emitChange() {
  window.dispatchEvent(new Event("bunko:offline-change"));
}

export function offlinePageUrl(userId: string, volumeId: string, index: number) {
  return `/offline/volumes/${encodeURIComponent(userId)}/${encodeURIComponent(volumeId)}/pages/${index}`;
}

export function openOfflineLibrary() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VOLUMES)) {
        const store = db.createObjectStore(VOLUMES, { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("userSection", ["userId", "section"], { unique: false });
      }
      if (!db.objectStoreNames.contains(PAGES)) {
        const store = db.createObjectStore(PAGES, { keyPath: "key" });
        store.createIndex("volume", ["userId", "volumeId"], { unique: false });
      }
      if (!db.objectStoreNames.contains(DOWNLOADS)) {
        const store = db.createObjectStore(DOWNLOADS, { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains(OPERATIONS)) {
        const store = db.createObjectStore(OPERATIONS, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineVolume(userId: string, volumeId: string) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(VOLUMES, "readonly");
  const value = await request<(OfflineVolume & { key: string }) | undefined>(
    tx.objectStore(VOLUMES).get(volumeKey(userId, volumeId)),
  );
  db.close();
  return value ? withoutKey(value) : null;
}

export async function getReadyVolumes(userId: string, section?: LibrarySection) {
  const db = await openOfflineLibrary();
  const tx = db.transaction([VOLUMES, DOWNLOADS], "readonly");
  const [volumes, downloads] = await Promise.all([
    request<Array<OfflineVolume & { key: string }>>(
    section
      ? tx.objectStore(VOLUMES).index("userSection").getAll([userId, section])
      : tx.objectStore(VOLUMES).index("userId").getAll(userId),
    ),
    request<OfflineDownload[]>(tx.objectStore(DOWNLOADS).index("userId").getAll(userId)),
  ]);
  db.close();
  const readyIds = new Set(downloads.filter((download) => download.status === "ready").map((download) => download.volumeId));
  const ready = volumes.filter((volume) => readyIds.has(volume.id)).map(withoutKey);
  return ready.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getDownload(userId: string, volumeId: string) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(DOWNLOADS, "readonly");
  const value = await request<OfflineDownload | undefined>(tx.objectStore(DOWNLOADS).get(downloadKey(userId, volumeId)));
  db.close();
  return value ?? null;
}

export async function getOfflineImages(userId: string, volumeId: string) {
  const download = await getDownload(userId, volumeId);
  if (download?.status !== "ready") return [];
  return Array.from({ length: download.totalPages }, (_, index) => offlinePageUrl(userId, volumeId, index));
}

async function putDownload(download: OfflineDownload) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(DOWNLOADS, "readwrite");
  tx.objectStore(DOWNLOADS).put(download);
  await transactionDone(tx);
  db.close();
  emitChange();
}

async function saveManifest(userId: string, manifest: OfflineVolumeManifest) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(VOLUMES, "readwrite");
  tx.objectStore(VOLUMES).put({
    key: volumeKey(userId, manifest.id),
    userId,
    id: manifest.id,
    slug: manifest.slug,
    section: manifest.section,
    title: manifest.title,
    seriesId: manifest.series.id,
    seriesSlug: manifest.series.slug,
    seriesTitle: manifest.series.title,
    isOneshot: manifest.series.isOneshot,
    mangaStyle: manifest.mangaStyle,
    metadata: manifest.metadata,
    coverUrl: manifest.coverUrl,
    isRead: manifest.isRead,
    isFavorite: manifest.isFavorite,
    lastPage: manifest.lastPage,
    totalPages: manifest.totalPages,
  });
  await transactionDone(tx);
  db.close();
}

async function hasPage(userId: string, volumeId: string, index: number) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(PAGES, "readonly");
  const value = await request<OfflinePage | undefined>(tx.objectStore(PAGES).get(pageKey(userId, volumeId, index)));
  db.close();
  return !!value;
}

async function savePage(userId: string, volumeId: string, index: number, blob: Blob) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(PAGES, "readwrite");
  tx.objectStore(PAGES).put({ key: pageKey(userId, volumeId, index), userId, volumeId, index, blob } satisfies OfflinePage);
  await transactionDone(tx);
  db.close();
}

async function fetchManifest(section: LibrarySection, kind: "volume" | "series", slug: string) {
  const response = await fetch(`/api/offline/library/${section}/${kind}/${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error("No se pudo preparar la descarga offline");
  return response.json() as Promise<{ volume?: OfflineVolumeManifest; volumes?: OfflineVolumeManifest[] }>;
}

async function fetchBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo descargar una página");
  return response.blob();
}

export async function downloadOfflineVolume(
  userId: string,
  manifest: OfflineVolumeManifest,
  onProgress?: (download: OfflineDownload) => void,
) {
  if (!navigator.onLine) throw new Error("Se requiere conexión para descargar");
  await navigator.storage?.persist?.();
  await saveManifest(userId, manifest);

  const pagesResponse = await fetch("/api/reader/manga", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: manifest.slug }),
  });
  const pagesData = await pagesResponse.json() as { images?: string[] };
  if (!pagesResponse.ok || !pagesData.images?.length) throw new Error("No se encontraron páginas para descargar");

  let size = 0;
  let completedPages = 0;
  const totalPages = pagesData.images.length;
  const publish = async (status: OfflineDownloadStatus, error?: string) => {
    const download: OfflineDownload = {
      key: downloadKey(userId, manifest.id), userId, volumeId: manifest.id, status,
      completedPages, totalPages, size, error, updatedAt: new Date().toISOString(),
    };
    await putDownload(download);
    onProgress?.(download);
    return download;
  };

  try {
    await publish("queued");
    if (manifest.coverUrl && !(await hasPage(userId, manifest.id, -1))) {
      const cover = await fetchBlob(manifest.coverUrl);
      await savePage(userId, manifest.id, -1, cover);
      size += cover.size;
    }

    for (let index = 0; index < pagesData.images.length; index++) {
      if (await hasPage(userId, manifest.id, index)) {
        completedPages++;
        continue;
      }
      await publish("downloading");
      const blob = await fetchBlob(pagesData.images[index]);
      await savePage(userId, manifest.id, index, blob);
      size += blob.size;
      completedPages++;
      await publish("downloading");
    }

    const ready = await publish("ready");
    const db = await openOfflineLibrary();
    const tx = db.transaction(VOLUMES, "readwrite");
    const stored = await request<(OfflineVolume & { key: string }) | undefined>(tx.objectStore(VOLUMES).get(volumeKey(userId, manifest.id)));
    if (stored) tx.objectStore(VOLUMES).put({ ...stored, downloadedAt: new Date().toISOString(), totalPages: totalPages });
    await transactionDone(tx);
    db.close();
    emitChange();
    return ready;
  } catch (error) {
    await publish("error", error instanceof Error ? error.message : "Error al descargar");
    throw error;
  }
}

export async function downloadVolumeBySlug(userId: string, section: LibrarySection, slug: string, onProgress?: (download: OfflineDownload) => void) {
  const data = await fetchManifest(section, "volume", slug);
  if (!data.volume) throw new Error("Tomo no encontrado");
  return downloadOfflineVolume(userId, data.volume, onProgress);
}

export async function downloadSeriesBySlug(userId: string, section: LibrarySection, slug: string, onProgress?: (completed: number, total: number) => void) {
  const data = await fetchManifest(section, "series", slug);
  const volumes = data.volumes ?? [];
  if (!volumes.length) throw new Error("La serie no tiene tomos descargables");
  let completed = 0;
  for (const volume of volumes) {
    await downloadOfflineVolume(userId, volume);
    completed++;
    onProgress?.(completed, volumes.length);
  }
}

export async function removeOfflineVolume(userId: string, volumeId: string) {
  const db = await openOfflineLibrary();
  const pageTx = db.transaction(PAGES, "readwrite");
  const keys = await request<IDBValidKey[]>(pageTx.objectStore(PAGES).index("volume").getAllKeys([userId, volumeId]));
  keys.forEach((key) => pageTx.objectStore(PAGES).delete(key));
  await transactionDone(pageTx);
  const tx = db.transaction([VOLUMES, DOWNLOADS], "readwrite");
  tx.objectStore(VOLUMES).delete(volumeKey(userId, volumeId));
  tx.objectStore(DOWNLOADS).delete(downloadKey(userId, volumeId));
  await transactionDone(tx);
  db.close();
  emitChange();
}

export async function removeOfflineSeries(userId: string, seriesId: string) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(VOLUMES, "readonly");
  const volumes = await request<Array<OfflineVolume & { key: string }>>(tx.objectStore(VOLUMES).index("userId").getAll(userId));
  db.close();
  await Promise.all(volumes.filter((volume) => volume.seriesId === seriesId).map((volume) => removeOfflineVolume(userId, volume.id)));
}

export async function updateOfflineVolume(userId: string, volumeId: string, update: Partial<Pick<OfflineVolume, "isRead" | "isFavorite" | "lastPage" | "totalPages">>) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(VOLUMES, "readwrite");
  const stored = await request<(OfflineVolume & { key: string }) | undefined>(tx.objectStore(VOLUMES).get(volumeKey(userId, volumeId)));
  if (stored) tx.objectStore(VOLUMES).put({ ...stored, ...update });
  await transactionDone(tx);
  db.close();
  emitChange();
}

export async function enqueueOfflineOperation(userId: string, kind: OfflineOperationKind, payload: Record<string, unknown>) {
  const db = await openOfflineLibrary();
  const tx = db.transaction(OPERATIONS, "readwrite");
  const id = crypto.randomUUID();
  tx.objectStore(OPERATIONS).put({ id, userId, kind, payload, createdAt: new Date().toISOString() } satisfies OfflineOperation);
  await transactionDone(tx);
  db.close();
  emitChange();
}

export async function flushOfflineOperations(userId: string) {
  if (!navigator.onLine) return;
  const db = await openOfflineLibrary();
  const tx = db.transaction(OPERATIONS, "readonly");
  const operations = await request<OfflineOperation[]>(tx.objectStore(OPERATIONS).index("userId").getAll(userId));
  db.close();
  if (!operations.length) return;
  const response = await fetch("/api/offline/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operations }),
  });
  if (!response.ok) return;
  const data = await response.json() as { completed?: string[] };
  if (!data.completed?.length) return;
  const writable = await openOfflineLibrary();
  const writableTx = writable.transaction(OPERATIONS, "readwrite");
  data.completed.forEach((id) => writableTx.objectStore(OPERATIONS).delete(id));
  await transactionDone(writableTx);
  writable.close();
  emitChange();
}

export async function resumeOfflineDownloads(userId: string) {
  if (!navigator.onLine) return;
  const db = await openOfflineLibrary();
  const tx = db.transaction([DOWNLOADS, VOLUMES], "readonly");
  const downloads = await request<OfflineDownload[]>(tx.objectStore(DOWNLOADS).index("userId").getAll(userId));
  const storedVolumes = await request<Array<OfflineVolume & { key: string }>>(tx.objectStore(VOLUMES).index("userId").getAll(userId));
  const pending = downloads.filter((download) => download.status === "downloading" || download.status === "queued" || download.status === "error");
  const manifests: OfflineVolumeManifest[] = [];
  for (const download of pending) {
    const volume = storedVolumes.find((item) => item.id === download.volumeId);
    if (!volume) continue;
    manifests.push({
      id: volume.id, slug: volume.slug, section: volume.section, title: volume.title,
      series: { id: volume.seriesId, slug: volume.seriesSlug, title: volume.seriesTitle, isOneshot: volume.isOneshot },
      mangaStyle: volume.mangaStyle, metadata: volume.metadata, coverUrl: volume.coverUrl,
      isRead: volume.isRead, isFavorite: volume.isFavorite, lastPage: volume.lastPage, totalPages: volume.totalPages,
    });
  }
  db.close();
  for (const manifest of manifests) {
    try { await downloadOfflineVolume(userId, manifest); } catch { /* retry on next connection */ }
  }
}

function withoutKey(value: OfflineVolume & { key: string }): OfflineVolume {
  const { key: _key, ...volume } = value;
  return volume;
}
