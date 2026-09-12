"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  Minimize2Icon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";

type ReaderTheme = "light" | "sepia" | "dark";
type ReaderFlow = "paginated" | "scrolled-continuous";
type TocEntry = { label: string; href: string; subitems?: TocEntry[] };
type ReaderState = {
  progress: { cfi?: string | null; progression?: number | null } | null;
  bookmarks: Array<{ cfi: string }>;
  annotations: Array<{ cfiRange: string }>;
};

interface EpubReaderProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
}

const fileCache = new Map<string, ArrayBuffer>();
const maxCachedBooks = 3;

const themeStyles: Record<ReaderTheme, { background: string; color: string }> = {
  light: { background: "#fffdf7", color: "#1f1b16" },
  sepia: { background: "#f3e7cf", color: "#47382a" },
  dark: { background: "#181716", color: "#f5efe4" },
};

async function getBookBuffer(slug: string): Promise<ArrayBuffer> {
  const cached = fileCache.get(slug);
  if (cached) return cached.slice(0);

  const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/file`);
  if (!response.ok) throw new Error("No fue posible abrir este EPUB.");
  const buffer = await response.arrayBuffer();
  fileCache.set(slug, buffer);
  if (fileCache.size > maxCachedBooks) {
    const oldest = fileCache.keys().next().value;
    if (oldest) fileCache.delete(oldest);
  }
  return buffer.slice(0);
}

export default function EpubReader({ isOpen, onClose, slug, title, layout }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const tocPanelRef = useRef<HTMLElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const flowRef = useRef<ReaderFlow>("paginated");
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [cfi, setCfi] = useState<string | null>(null);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [flow, setFlow] = useState<ReaderFlow>("paginated");
  const [fontSize, setFontSize] = useState(100);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [margin, setMargin] = useState(24);
  const [columnWidth, setColumnWidth] = useState(720);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [bookmarkCfis, setBookmarkCfis] = useState<string[]>([]);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Array<{ label: string; cfi: string }>>([]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const closePanels = useCallback(() => {
    setShowSettings(false);
    setShowToc(false);
  }, []);

  const persistProgress = useCallback(async (location: any) => {
    const nextCfi = location?.start?.cfi;
    if (!nextCfi) return;
    const percentage = typeof location.start.percentage === "number"
      ? location.start.percentage
      : bookRef.current?.locations?.percentageFromCfi?.(nextCfi) ?? 0;
    setCfi(nextCfi);
    setProgress(percentage);
    void fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cfi: nextCfi,
        progression: percentage,
        chapterHref: location.start.href,
        isRead: location.atEnd === true,
      }),
    });
  }, [slug]);

  const applyStyles = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition || layout === "pre-paginated") return;
    rendition.flow(flow);
    rendition.spread(flow === "paginated" ? "auto" : "none");
    rendition.themes.default({
      body: {
        "background-color": themeStyles[theme].background,
        color: themeStyles[theme].color,
        "font-family": `${fontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif"} !important`,
        "font-size": `${fontSize}% !important`,
        "line-height": `${lineHeight} !important`,
        "padding-left": `${margin}px !important`,
        "padding-right": `${margin}px !important`,
        "max-width": `${columnWidth}px !important`,
        margin: "0 auto !important",
      },
    });
  }, [columnWidth, flow, fontFamily, fontSize, layout, lineHeight, margin, theme]);

  useEffect(() => { applyStyles(); }, [applyStyles]);
  useEffect(() => { flowRef.current = flow; }, [flow]);

  useEffect(() => {
    if (!bookmarkMessage) return;
    const timer = setTimeout(() => setBookmarkMessage(null), 2400);
    return () => clearTimeout(timer);
  }, [bookmarkMessage]);

  useEffect(() => {
    if (!isOpen || showSettings || showToc) return;
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (!controlsVisible) return;
    hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [controlsVisible, isOpen, showSettings, showToc]);

  useEffect(() => {
    if (!isOpen || layout === "pre-paginated") return;
    setPreferencesLoaded(false);
    fetch("/api/reader/books/preferences")
      .then((response) => response.ok ? response.json() : null)
      .then((preferences) => {
        if (!preferences) return;
        setTheme(preferences.theme);
        setFlow(preferences.flow);
        setFontFamily(preferences.fontFamily);
        setFontSize(preferences.fontSize);
        setLineHeight(preferences.lineHeight);
        setMargin(preferences.margin);
        setColumnWidth(preferences.columnWidth);
      })
      .catch(() => undefined)
      .finally(() => setPreferencesLoaded(true));
  }, [isOpen, layout]);

  useEffect(() => {
    if (!isOpen || layout === "pre-paginated" || !preferencesLoaded) return;
    void fetch("/api/reader/books/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, flow, fontFamily, fontSize, lineHeight, margin, columnWidth }),
    });
  }, [columnWidth, flow, fontFamily, fontSize, isOpen, layout, lineHeight, margin, preferencesLoaded, theme]);

  useEffect(() => {
    if (!isOpen || !viewerRef.current) return;
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError(null);
      setControlsVisible(true);
      setBookmarkMessage(null);
      try {
        const [module, buffer, stateResponse] = await Promise.all([
          import("epubjs"),
          getBookBuffer(slug),
          fetch(`/api/reader/books/${encodeURIComponent(slug)}/state`),
        ]);
        const state: ReaderState = stateResponse.ok
          ? await stateResponse.json()
          : { progress: null, bookmarks: [], annotations: [] };
        const ePub = module.default;
        const book = ePub(buffer);
        bookRef.current = book;
        await book.ready;
        if (cancelled || !viewerRef.current) return;

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: layout === "pre-paginated" ? "paginated" : flowRef.current,
          allowScriptedContent: false,
          spread: "auto",
          minSpreadWidth: 720,
        });
        renditionRef.current = rendition;
        rendition.hooks.content.register((contents: any) => {
          const document = contents.document as Document;
          const body = document.body;
          const images = Array.from(body.querySelectorAll("img"));
          const text = body.textContent?.replace(/\s/g, "") ?? "";

          if (images.length && text.length < 80) {
            body.style.setProperty("display", "grid", "important");
            body.style.setProperty("place-items", "center", "important");
            body.style.setProperty("min-height", "100%", "important");
            images.forEach((image) => {
              image.style.setProperty("width", "auto", "important");
              image.style.setProperty("height", "auto", "important");
              image.style.setProperty("max-width", "100%", "important");
              image.style.setProperty("max-height", "100%", "important");
              image.style.setProperty("object-fit", "contain", "important");
            });
          }

          document.addEventListener("click", () => {
            closePanels();
            setControlsVisible((visible) => !visible);
          });
        });
        if (layout === "reflowable") applyStyles();
        rendition.on("relocated", persistProgress);
        rendition.on("selected", async (cfiRange: string, contents: any) => {
          const excerpt = contents.window.getSelection()?.toString().trim();
          if (!excerpt) return;
          const note = window.prompt("Nota para el resaltado (opcional):") ?? "";
          const created = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cfiRange, excerpt, note, color: "yellow" }),
          });
          if (created.ok) rendition.annotations.highlight(cfiRange, {}, () => {}, "bunko-highlight", { fill: "#facc15", "fill-opacity": "0.45" });
          contents.window.getSelection()?.removeAllRanges();
        });

        setBookmarkCfis(state.bookmarks.map((bookmark) => bookmark.cfi));
        for (const annotation of state.annotations) {
          rendition.annotations.highlight(annotation.cfiRange, {}, () => {}, "bunko-highlight", { fill: "#facc15", "fill-opacity": "0.45" });
        }
        await rendition.display(state.progress?.cfi ?? undefined);
        const currentCfi = rendition.currentLocation?.()?.start?.cfi;
        if (currentCfi) setCfi(currentCfi);
        setProgress(state.progress?.progression ?? 0);
        setToc((book.navigation?.toc ?? []) as TocEntry[]);

        void book.locations.generate(1600).then(() => {
          const displayedCfi = rendition.currentLocation?.()?.start?.cfi;
          if (!displayedCfi) return;
          setProgress(book.locations.percentageFromCfi(displayedCfi));
        });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No fue posible abrir el libro.");
      } finally {
        if (!cancelled) {
          setControlsVisible(true);
          setLoading(false);
        }
      }
    };

    initialize();
    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current?.destroy();
      bookRef.current = null;
    };
  }, [applyStyles, closePanels, isOpen, layout, persistProgress, slug]);

  useEffect(() => {
    if (!isOpen || !("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then((lock) => { wakeLockRef.current = lock; }).catch(() => undefined);
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        if (showSettings || showToc) closePanels();
        else onClose();
      }
      if (event.key === "ArrowLeft") renditionRef.current?.prev();
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        renditionRef.current?.next();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanels, isOpen, onClose, showSettings, showToc]);

  useEffect(() => {
    if (!isOpen || (!showSettings && !showToc)) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (settingsPanelRef.current?.contains(target) || tocPanelRef.current?.contains(target)) return;
      closePanels();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [closePanels, isOpen, showSettings, showToc]);

  const openToc = async (href: string) => {
    await renditionRef.current?.display(href);
    setShowToc(false);
  };

  const addBookmark = async () => {
    const currentCfi = cfi ?? renditionRef.current?.currentLocation?.()?.start?.cfi;
    if (!currentCfi) {
      setBookmarkMessage("Todavía no hay una ubicación para marcar.");
      return;
    }
    if (bookmarkCfis.includes(currentCfi)) {
      setBookmarkMessage("Esta página ya está marcada.");
      return;
    }
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cfi: currentCfi, label: title }),
    });
    if (response.ok) {
      setBookmarkCfis((current) => [...current, currentCfi]);
      setBookmarkMessage("Marcador guardado.");
    } else {
      setBookmarkMessage("No fue posible guardar el marcador.");
    }
  };

  const runSearch = async () => {
    const book = bookRef.current;
    const term = search.trim().toLocaleLowerCase();
    if (!book || !term) return setMatches([]);
    const results: Array<{ label: string; cfi: string }> = [];
    const sections = book.spine?.spineItems ?? [];
    for (const section of sections) {
      const found = await section.find(term);
      for (const match of found ?? []) results.push({ label: match.excerpt || section.href, cfi: match.cfi });
    }
    setMatches(results.slice(0, 50));
  };

  const togglePanel = (panel: "toc" | "settings") => {
    revealControls();
    if (panel === "toc") {
      setShowToc((visible) => !visible);
      setShowSettings(false);
    } else {
      setShowSettings((visible) => !visible);
      setShowToc(false);
    }
  };

  if (!isOpen) return null;
  const isBookmarked = !!cfi && bookmarkCfis.includes(cfi);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-onix text-sand">
      <header className={`absolute inset-x-0 top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-white/15 bg-onix/95 px-3 transition-transform duration-200 ${controlsVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"}`}>
        <span className="min-w-0 truncate font-semibold">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => togglePanel("toc")} title="Índice" aria-label="Índice" className="cursor-pointer p-2"><MenuIcon size={24} /></button>
          <button onClick={addBookmark} title="Agregar marcador" aria-label="Agregar marcador" className="cursor-pointer p-2"><BookmarkIcon size={24} className={isBookmarked ? "fill-lilah text-lilah" : ""} /></button>
          {layout === "reflowable" && <button onClick={() => togglePanel("settings")} title="Ajustes de lectura" aria-label="Ajustes de lectura" className="cursor-pointer p-2"><Settings2Icon size={24} /></button>}
          <button onClick={onClose} title="Cerrar lector" aria-label="Cerrar lector" className="cursor-pointer p-2"><Minimize2Icon size={24} /></button>
        </div>
      </header>

      {showSettings && (
        <div ref={settingsPanelRef} className="absolute right-3 top-12 z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-b-lg bg-blackamber p-5 shadow-xl">
          <div className="grid gap-4 text-base">
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Tema<select value={theme} onChange={(event) => setTheme(event.target.value as ReaderTheme)} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="light">Claro</option><option value="sepia">Sepia</option><option value="dark">Oscuro</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Flujo<select value={flow} onChange={(event) => setFlow(event.target.value as ReaderFlow)} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="paginated">Páginas</option><option value="scrolled-continuous">Desplazamiento</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Fuente<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value as "serif" | "sans")} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="serif">Serif</option><option value="sans">Sans</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Tamaño<input className="w-full cursor-pointer accent-lilah" type="range" min="80" max="160" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Interlineado<input className="w-full cursor-pointer accent-lilah" type="range" min="1.2" max="2.4" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Márgenes<input className="w-full cursor-pointer accent-lilah" type="range" min="0" max="80" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">Columna<input className="w-full cursor-pointer accent-lilah" type="range" min="320" max="1200" value={columnWidth} onChange={(event) => setColumnWidth(Number(event.target.value))} /></label>
          </div>
        </div>
      )}

      {showToc && (
        <aside ref={tocPanelRef} className="absolute bottom-0 left-0 top-12 z-40 w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto bg-blackamber p-5 shadow-xl">
          <div className="mb-4 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder="Buscar en el libro" className="min-w-0 flex-1 rounded bg-onix px-3 py-2 text-base" /><button onClick={runSearch} className="cursor-pointer rounded bg-lilah p-2 text-onix"><SearchIcon size={20} /></button></div>
          {matches.map((match) => <button key={match.cfi} onClick={() => openToc(match.cfi)} className="block w-full cursor-pointer py-2 text-left text-base hover:text-lilah">{match.label}</button>)}
          {toc.map((entry) => <button key={entry.href} onClick={() => openToc(entry.href)} className="block w-full cursor-pointer py-2 text-left text-base hover:text-lilah">{entry.label}</button>)}
        </aside>
      )}

      {bookmarkMessage && <p className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded bg-blackamber px-3 py-2 text-sm shadow">{bookmarkMessage}</p>}

      <main className="relative h-full w-full" style={themeStyles[theme]} onPointerUp={(event) => {
        if (event.target === event.currentTarget) {
          closePanels();
          setControlsVisible((visible) => !visible);
        }
      }}>
        {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-onix">Abriendo EPUB…</div>}
        {error && <div className="absolute inset-0 z-20 grid place-items-center bg-onix p-6 text-center">{error}</div>}
        <div ref={viewerRef} className="h-full w-full" />
      </main>

      <footer className={`absolute inset-x-0 bottom-0 z-30 flex h-11 items-center justify-between gap-4 border-t border-white/15 bg-onix/95 px-3 transition-transform duration-200 ${controlsVisible ? "translate-y-0" : "translate-y-full pointer-events-none"}`}>
        <button onClick={() => renditionRef.current?.prev()} title="Anterior" aria-label="Anterior" className="cursor-pointer p-2"><ChevronLeftIcon size={24} /></button>
        <span className="text-sm">{Math.round(progress * 100)}%</span>
        <button onClick={() => renditionRef.current?.next()} title="Siguiente" aria-label="Siguiente" className="cursor-pointer p-2"><ChevronRightIcon size={24} /></button>
      </footer>
    </div>
  );
}
