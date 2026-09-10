"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { flushOfflineOperations, getReadyVolumes, resumeOfflineDownloads } from "@/lib/client/offlineLibrary";

interface PwaContextValue {
  online: boolean;
  offlineSlugs: Set<string>;
  offlineVolumeIds: Set<string>;
  offlineSeriesIds: Set<string>;
}

const PwaContext = createContext<PwaContextValue>({
  online: true,
  offlineSlugs: new Set(),
  offlineVolumeIds: new Set(),
  offlineSeriesIds: new Set(),
});
const RELOAD_KEY = "bunko-sw-reload";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function PwaProvider({ userId, children }: { userId?: string; children: React.ReactNode }) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const router = useRouter();
  const [offlineSlugs, setOfflineSlugs] = useState<Set<string>>(new Set());
  const [offlineVolumeIds, setOfflineVolumeIds] = useState<Set<string>>(new Set());
  const [offlineSeriesIds, setOfflineSeriesIds] = useState<Set<string>>(new Set());
  const wasOnline = useRef(online);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const reload = () => {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    };
    const clear = () => sessionStorage.removeItem(RELOAD_KEY);
    navigator.serviceWorker.addEventListener("controllerchange", reload);
    window.addEventListener("load", clear);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reload);
      window.removeEventListener("load", clear);
    };
  }, []);

  useEffect(() => {
    const reconnected = !wasOnline.current && online;
    wasOnline.current = online;
    if (!userId || !online) return;
    void (async () => {
      await resumeOfflineDownloads(userId);
      await flushOfflineOperations(userId);
      if (reconnected) router.refresh();
    })();
  }, [online, router, userId]);

  useEffect(() => {
    if (!userId) {
      setOfflineSlugs(new Set());
      setOfflineVolumeIds(new Set());
      setOfflineSeriesIds(new Set());
      return;
    }
    const load = () => {
      void getReadyVolumes(userId).then((volumes) => {
        setOfflineSlugs(new Set(volumes.map((volume) => volume.slug)));
        setOfflineVolumeIds(new Set(volumes.map((volume) => volume.id)));
        setOfflineSeriesIds(new Set(volumes.map((volume) => volume.seriesId)));
      });
    };
    load();
    window.addEventListener("bunko:offline-change", load);
    return () => window.removeEventListener("bunko:offline-change", load);
  }, [userId]);

  useEffect(() => {
    document.documentElement.dataset.offline = online ? "false" : "true";
  }, [online]);

  useEffect(() => {
    const intercept = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const url = new URL(target.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      window.history.pushState({}, "", `${url.pathname}${url.search}`);
      window.dispatchEvent(new Event("bunko:offline-navigate"));
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, []);

  const value = useMemo(
    () => ({ online, offlineSlugs, offlineVolumeIds, offlineSeriesIds }),
    [offlineSeriesIds, offlineSlugs, offlineVolumeIds, online],
  );
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  return useContext(PwaContext);
}
