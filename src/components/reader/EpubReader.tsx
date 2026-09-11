"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon, Minimize2Icon, SearchIcon, Settings2Icon } from "lucide-react";

type ReaderTheme = "light" | "sepia" | "dark";
type ReaderFlow = "paginated" | "scrolled-continuous";
type TocEntry = { label: string; href: string; subitems?: TocEntry[] };

interface EpubReaderProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
}

const themeStyles: Record<ReaderTheme, { background: string; color: string }> = {
  light: { background: "#fffdf7", color: "#1f1b16" },
  sepia: { background: "#f3e7cf", color: "#47382a" },
  dark: { background: "#181716", color: "#f5efe4" },
};

export default function EpubReader({ isOpen, onClose, slug, title, layout }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const flowRef = useRef<ReaderFlow>("paginated");
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
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Array<{ label: string; cfi: string }>>([]);

  const persistProgress = useCallback(async (location: any) => {
    const nextCfi = location?.start?.cfi;
    if (!nextCfi) return;
    const percent = typeof location.start.percentage === "number" ? location.start.percentage : 0;
    setCfi(nextCfi);
    setProgress(percent);
    await fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cfi: nextCfi, progression: percent, chapterHref: location.start.href, isRead: location.atEnd === true }),
    });
  }, [slug]);

  const applyStyles = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition || layout === "pre-paginated") return;
    rendition.flow(flow);
    rendition.themes.default({ body: { "background-color": themeStyles[theme].background, color: themeStyles[theme].color, "font-family": `${fontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif"} !important`, "font-size": `${fontSize}% !important`, "line-height": `${lineHeight} !important`, "padding-left": `${margin}px !important`, "padding-right": `${margin}px !important`, "max-width": `${columnWidth}px !important`, margin: "0 auto !important" } });
  }, [columnWidth, flow, fontFamily, fontSize, layout, lineHeight, margin, theme]);

  useEffect(() => { applyStyles(); }, [applyStyles]);
  useEffect(() => { flowRef.current = flow; }, [flow]);

  useEffect(() => {
    if (!isOpen || layout === "pre-paginated") return;
    setPreferencesLoaded(false);
    fetch("/api/reader/books/preferences")
      .then((response) => response.ok ? response.json() : null)
      .then((preferences) => {
        if (preferences) {
          setTheme(preferences.theme); setFlow(preferences.flow); setFontFamily(preferences.fontFamily);
          setFontSize(preferences.fontSize); setLineHeight(preferences.lineHeight); setMargin(preferences.margin); setColumnWidth(preferences.columnWidth);
        }
      })
      .catch(() => undefined)
      .finally(() => setPreferencesLoaded(true));
  }, [isOpen, layout]);

  useEffect(() => {
    if (!isOpen || layout === "pre-paginated" || !preferencesLoaded) return;
    void fetch("/api/reader/books/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme, flow, fontFamily, fontSize, lineHeight, margin, columnWidth }) });
  }, [columnWidth, flow, fontFamily, fontSize, isOpen, layout, lineHeight, margin, preferencesLoaded, theme]);

  useEffect(() => {
    if (!isOpen || !viewerRef.current) return;
    let cancelled = false;
    const initialize = async () => {
      setLoading(true); setError(null);
      try {
        const [module, fileResponse, progressResponse, bookmarkResponse, annotationResponse] = await Promise.all([
          import("epubjs"),
          fetch(`/api/reader/books/${encodeURIComponent(slug)}/file`),
          fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`),
          fetch(`/api/reader/books/${encodeURIComponent(slug)}/bookmarks`),
          fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`),
        ]);
        if (!fileResponse.ok) throw new Error("No fue posible abrir este EPUB.");
        const ePub = module.default;
        const book = ePub(await fileResponse.arrayBuffer());
        bookRef.current = book;
        await book.ready;
        if (cancelled || !viewerRef.current) return;
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%", height: "100%", flow: layout === "pre-paginated" ? "paginated" : flowRef.current,
          allowScriptedContent: false, spread: layout === "pre-paginated" ? "auto" : "none",
        });
        renditionRef.current = rendition;
        if (layout === "reflowable") {
          rendition.themes.default({ body: { "background-color": themeStyles.light.background, color: themeStyles.light.color, "font-size": "100% !important", "line-height": "1.6 !important" } });
        }
        rendition.on("relocated", persistProgress);
        rendition.on("selected", async (cfiRange: string, contents: any) => {
          const excerpt = contents.window.getSelection()?.toString().trim();
          if (!excerpt) return;
          const note = window.prompt("Nota para el resaltado (opcional):") ?? "";
          const created = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cfiRange, excerpt, note, color: "yellow" }),
          });
          if (created.ok) rendition.annotations.highlight(cfiRange, {}, () => {}, "bunko-highlight", { fill: "#facc15", "fill-opacity": "0.45" });
          contents.window.getSelection()?.removeAllRanges();
        });
        const savedProgress = progressResponse.ok ? await progressResponse.json() : null;
        const savedAnnotations = annotationResponse.ok ? await annotationResponse.json() : [];
        await bookmarkResponse.json().catch(() => []);
        for (const annotation of savedAnnotations) {
          rendition.annotations.highlight(annotation.cfiRange, {}, () => {}, "bunko-highlight", { fill: "#facc15", "fill-opacity": "0.45" });
        }
        await book.locations.generate(1600);
        await rendition.display(savedProgress?.cfi ?? undefined);
        setToc((book.navigation?.toc ?? []) as TocEntry[]);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No fue posible abrir el libro.");
      } finally { if (!cancelled) setLoading(false); }
    };
    initialize();
    return () => {
      cancelled = true;
      renditionRef.current?.destroy(); renditionRef.current = null;
      bookRef.current?.destroy(); bookRef.current = null;
    };
  }, [isOpen, layout, persistProgress, slug]);

  useEffect(() => {
    if (!isOpen || !("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then((lock) => { wakeLockRef.current = lock; }).catch(() => undefined);
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") renditionRef.current?.prev();
      if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); renditionRef.current?.next(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const openToc = async (href: string) => { await renditionRef.current?.display(href); setShowToc(false); };
  const addBookmark = async () => {
    if (!cfi) return;
    await fetch(`/api/reader/books/${encodeURIComponent(slug)}/bookmarks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cfi, label: title }) });
  };
  const runSearch = async () => {
    const book = bookRef.current;
    const term = search.trim().toLocaleLowerCase();
    if (!book || !term) return setMatches([]);
    const results: Array<{ label: string; cfi: string }> = [];
    const sections = book.spine?.spineItems ?? [];
    for (const section of sections) {
      const found = await section.find(term);
      for (const match of found ?? []) {
        results.push({ label: match.excerpt || section.href, cfi: match.cfi });
      }
    }
    setMatches(results.slice(0, 50));
  };

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex flex-col bg-onix text-sand">
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/15 px-3">
      <span className="min-w-0 truncate font-semibold">{title}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowToc((value) => !value)} title="Índice" className="p-2">☰</button>
        <button onClick={addBookmark} title="Agregar marcador" className="p-2"><BookmarkIcon size={20} /></button>
        {layout === "reflowable" && <button onClick={() => setShowSettings((value) => !value)} title="Ajustes de lectura" className="p-2"><Settings2Icon size={20} /></button>}
        <button onClick={onClose} title="Cerrar lector" className="p-2"><Minimize2Icon size={20} /></button>
      </div>
    </header>
    {showSettings && <div className="absolute right-3 top-14 z-20 w-72 rounded-b-lg bg-neutral-900 p-4 shadow-xl">
      <label className="block text-sm">Tema <select value={theme} onChange={(event) => setTheme(event.target.value as ReaderTheme)} className="ml-2 bg-transparent"><option value="light">Claro</option><option value="sepia">Sepia</option><option value="dark">Oscuro</option></select></label>
      <label className="mt-3 block text-sm">Flujo <select value={flow} onChange={(event) => setFlow(event.target.value as ReaderFlow)} className="ml-2 bg-transparent"><option value="paginated">Páginas</option><option value="scrolled-continuous">Desplazamiento</option></select></label>
      <label className="mt-3 block text-sm">Fuente <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value as "serif" | "sans")} className="ml-2 bg-transparent"><option value="serif">Serif</option><option value="sans">Sans</option></select></label>
      <label className="mt-3 block text-sm">Tamaño <input className="ml-2 w-32" type="range" min="80" max="160" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
      <label className="mt-3 block text-sm">Interlineado <input className="ml-2 w-32" type="range" min="1.2" max="2.4" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} /></label>
      <label className="mt-3 block text-sm">Márgenes <input className="ml-2 w-32" type="range" min="0" max="80" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></label>
      <label className="mt-3 block text-sm">Columna <input className="ml-2 w-32" type="range" min="320" max="1200" value={columnWidth} onChange={(event) => setColumnWidth(Number(event.target.value))} /></label>
    </div>}
    {showToc && <aside className="absolute bottom-0 left-0 top-14 z-20 w-80 overflow-y-auto bg-neutral-900 p-4 shadow-xl">
      <div className="mb-3 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder="Buscar en el libro" className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1" /><button onClick={runSearch}><SearchIcon size={18} /></button></div>
      {matches.map((match) => <button key={match.cfi} onClick={() => openToc(match.cfi)} className="block w-full py-2 text-left text-sm hover:underline">{match.label}</button>)}
      {toc.map((entry) => <button key={entry.href} onClick={() => openToc(entry.href)} className="block w-full py-2 text-left hover:underline">{entry.label}</button>)}
    </aside>}
    <main className="relative min-h-0 flex-1" style={themeStyles[theme]}>
      {loading && <div className="absolute inset-0 z-10 grid place-items-center">Abriendo EPUB…</div>}
      {error && <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center">{error}</div>}
      <div ref={viewerRef} className="h-full w-full" />
    </main>
    <footer className="flex items-center justify-between gap-4 border-t border-white/15 px-3 py-2">
      <button onClick={() => renditionRef.current?.prev()} title="Anterior" className="p-2"><ChevronLeftIcon /></button>
      <span className="text-sm">{Math.round(progress * 100)}%</span>
      <button onClick={() => renditionRef.current?.next()} title="Siguiente" className="p-2"><ChevronRightIcon /></button>
    </footer>
  </div>;
}
