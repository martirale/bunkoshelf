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
  Trash2Icon,
} from "lucide-react";
import type { Dictionary } from "@/lib/types";

type ReaderTheme = "light" | "sepia" | "dark";
type ReaderFlow = "paginated" | "scrolled-continuous";
type TocEntry = { label: string; href: string; subitems?: TocEntry[] };
type ReaderState = {
  progress: { cfi?: string | null; progression?: number | null } | null;
  bookmarks: Array<{ id: string; cfi: string; label: string | null; chapterLabel: string | null }>;
  annotations: Array<{ id: string; cfiRange: string; excerpt: string | null; note: string | null; color: string }>;
};
type SelectionMenu = { cfiRange: string; excerpt: string; x: number; y: number };
type AnnotationMenu = { annotation: ReaderState["annotations"][number]; x: number; y: number };

const highlightStyles = {
  fill: "#8a6fdc",
  "fill-opacity": "0.26",
  "mix-blend-mode": "multiply",
};

interface EpubReaderProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
  intl: Dictionary;
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
  if (!response.ok) throw new Error("Book file request failed");
  const buffer = await response.arrayBuffer();
  fileCache.set(slug, buffer);
  if (fileCache.size > maxCachedBooks) {
    const oldest = fileCache.keys().next().value;
    if (oldest) fileCache.delete(oldest);
  }
  return buffer.slice(0);
}

function getLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function EpubReader({ isOpen, onClose, slug, title, layout, intl }: EpubReaderProps) {
  const reader = intl.epubReader as Record<string, string>;
  const viewerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tocPanelRef = useRef<HTMLElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const annotationsRef = useRef<ReaderState["annotations"]>([]);
  const pendingSelectionRef = useRef<{ cfiRange: string; contents: any } | null>(null);
  const flushPendingSelectionRef = useRef<() => void>(() => undefined);
  const readerKeyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => undefined);
  const pointerIsDownRef = useRef(false);
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
  const [bookmarks, setBookmarks] = useState<ReaderState["bookmarks"]>([]);
  const [annotations, setAnnotations] = useState<ReaderState["annotations"]>([]);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);
  const [annotationMenu, setAnnotationMenu] = useState<AnnotationMenu | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [annotationNoteEditorOpen, setAnnotationNoteEditorOpen] = useState(false);
  const [tocTab, setTocTab] = useState<"contents" | "bookmarks" | "annotations">("contents");
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Array<{ label: string; cfi: string }>>([]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    if (isOpen) return;
    pendingSelectionRef.current = null;
    setSelectionMenu(null);
    setAnnotationMenu(null);
    setNoteEditorOpen(false);
    setAnnotationNoteEditorOpen(false);
    setNoteDraft("");
  }, [isOpen]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const closePanels = useCallback(() => {
    setShowSettings(false);
    setShowToc(false);
  }, []);

  const closeReader = useCallback(() => {
    pendingSelectionRef.current = null;
    setSelectionMenu(null);
    setAnnotationMenu(null);
    setNoteEditorOpen(false);
    setAnnotationNoteEditorOpen(false);
    setNoteDraft("");
    closePanels();
    onClose();
  }, [closePanels, onClose]);

  const openAnnotationMenu = useCallback((annotation: ReaderState["annotations"][number], cfiRange: string, contents: any) => {
    const range = contents.range?.(cfiRange);
    const rangeRect = range?.getBoundingClientRect();
    const frameRect = contents.window?.frameElement?.getBoundingClientRect();
    setSelectionMenu(null);
    setNoteEditorOpen(false);
    setAnnotationNoteEditorOpen(false);
    setNoteDraft(annotation.note || "");
    setAnnotationMenu({
      annotation,
      x: (frameRect?.left ?? 0) + (rangeRect?.left ?? 0) + (rangeRect?.width ?? 0) / 2,
      y: (frameRect?.top ?? 0) + (rangeRect?.top ?? 0),
    });
    setControlsVisible(true);
  }, []);

  const renderAnnotation = useCallback((rendition: any, annotation: ReaderState["annotations"][number]) => {
    rendition.annotations.highlight(
      annotation.cfiRange,
      { id: annotation.id },
      undefined,
      "bunko-highlight",
      highlightStyles,
    );
  }, []);

  const findAnnotationAtPoint = useCallback((contents: any, x: number, y: number) => {
    return annotationsRef.current.find((annotation) => {
      const range = contents.range?.(annotation.cfiRange);
      const rects = range?.getClientRects?.() as DOMRectList | undefined;
      return Array.from(rects ?? []).some((rect) => (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      ));
    });
  }, []);

  const persistProgress = useCallback(async (location: any) => {
    const nextCfi = location?.start?.cfi;
    if (!nextCfi) return;
    setCfi(nextCfi);
    const isComplete = location.atEnd === true;
    const calculatedProgress = bookRef.current?.locations?.percentageFromCfi?.(nextCfi);
    const nextProgress = isComplete
      ? 1
      : typeof calculatedProgress === "number"
        ? calculatedProgress
        : undefined;
    if (nextProgress !== undefined) setProgress(nextProgress);
    void fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cfi: nextCfi,
        progression: nextProgress,
        chapterHref: location.start.href,
        isRead: isComplete,
        readingDate: getLocalDateString(),
      }),
    }).then((response) => {
      if (response.ok && isComplete) window.dispatchEvent(new Event("bunko:challenge-updated"));
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
        margin: "0 auto !important",
      },
    });
  }, [flow, fontFamily, fontSize, layout, lineHeight, margin, theme]);

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
          manager: "continuous",
          gap: 32,
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

          if (images.length === 1 && text.length === 0) {
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

          let touchStart: { x: number; y: number } | null = null;
          let ignoreClickUntil = 0;
          document.documentElement.style.touchAction = "pan-y";
          body.style.touchAction = "pan-y";
          const isInteractiveTarget = (target: EventTarget | null) => {
            return Boolean((target as HTMLElement | null)?.closest?.("a, button, input, select, textarea, [contenteditable='true']"));
          };
          const hasTextSelection = () => Boolean(contents.window.getSelection()?.toString().trim());
          const clearReaderOverlays = () => {
            closePanels();
            setSelectionMenu(null);
            setAnnotationMenu(null);
            setNoteEditorOpen(false);
            setAnnotationNoteEditorOpen(false);
          };
          const handleContentInteraction = (event: Event, x: number, y: number, navigate = false) => {
            if (hasTextSelection() || pendingSelectionRef.current || isInteractiveTarget(event.target)) return;
            const annotation = findAnnotationAtPoint(contents, x, y);
            if (annotation) {
              event.preventDefault();
              event.stopPropagation();
              openAnnotationMenu(annotation, annotation.cfiRange, contents);
              return;
            }
            clearReaderOverlays();
            if (navigate) {
              const width = contents.window.innerWidth;
              if (x < width / 3) {
                void rendition.prev();
                return;
              }
              if (x > (width * 2) / 3) {
                void rendition.next();
                return;
              }
            }
            setControlsVisible((visible) => !visible);
          };
          const handleContentClick = (event: MouseEvent) => {
            if (Date.now() < ignoreClickUntil) {
              event.preventDefault();
              return;
            }
            handleContentInteraction(event, event.clientX, event.clientY);
          };
          const handleTouchGesture = (event: Event, x: number, y: number) => {
            const start = touchStart;
            touchStart = null;
            if (!start || hasTextSelection() || isInteractiveTarget(event.target)) return;

            const deltaX = x - start.x;
            const deltaY = y - start.y;
            const distanceX = Math.abs(deltaX);
            const distanceY = Math.abs(deltaY);

            if (distanceX > 48 && distanceX > distanceY) {
              if (event.cancelable) event.preventDefault();
              event.stopPropagation();
              ignoreClickUntil = Date.now() + 500;
              clearReaderOverlays();
              void (deltaX < 0 ? rendition.next() : rendition.prev());
              return;
            }

            if (distanceX > 18 || distanceY > 18) {
              ignoreClickUntil = Date.now() + 500;
              return;
            }

            if (event.cancelable) event.preventDefault();
            ignoreClickUntil = Date.now() + 500;
            handleContentInteraction(event, x, y, true);
          };
          const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1) {
              touchStart = null;
              return;
            }
            const touch = event.touches[0];
            touchStart = { x: touch.clientX, y: touch.clientY };
          };
          const handleTouchEnd = (event: TouchEvent) => {
            const touch = event.changedTouches[0];
            if (!touch) return;
            handleTouchGesture(event, touch.clientX, touch.clientY);
          };
          const resetTouchGesture = () => {
            touchStart = null;
            pointerIsDownRef.current = false;
          };
          document.addEventListener("click", handleContentClick, true);
          document.addEventListener("keydown", (event) => readerKeyHandlerRef.current(event));
          const showPendingSelection = () => {
            window.setTimeout(() => {
              const pending = pendingSelectionRef.current;
              if (!pending || pending.contents !== contents) return;
              const selection = contents.window.getSelection();
              const excerpt = selection?.toString().trim();
              if (!excerpt) {
                pendingSelectionRef.current = null;
                return;
              }
              const range = selection.rangeCount ? selection.getRangeAt(0) : null;
              const selectionRect = range?.getBoundingClientRect();
              const frameRect = contents.window.frameElement?.getBoundingClientRect();
              const x = (frameRect?.left ?? 0) + (selectionRect?.left ?? 0) + (selectionRect?.width ?? 0) / 2;
              const y = (frameRect?.top ?? 0) + (selectionRect?.top ?? 0);
              const existing = annotationsRef.current.find((annotation) => annotation.cfiRange === pending.cfiRange);
              pendingSelectionRef.current = null;
              if (existing) {
                setSelectionMenu(null);
                setNoteEditorOpen(false);
                setAnnotationMenu({ annotation: existing, x, y });
              } else {
                setAnnotationMenu(null);
                setNoteEditorOpen(false);
                setAnnotationNoteEditorOpen(false);
                setNoteDraft("");
                setSelectionMenu({ cfiRange: pending.cfiRange, excerpt, x, y });
              }
              setControlsVisible(true);
              selection?.removeAllRanges();
            }, 0);
          };
          flushPendingSelectionRef.current = showPendingSelection;
          const markPointerDown = () => { pointerIsDownRef.current = true; };
          const markPointerUp = () => { pointerIsDownRef.current = false; showPendingSelection(); };
          document.addEventListener("mousedown", markPointerDown, true);
          document.addEventListener("mouseup", markPointerUp, true);
          body.addEventListener("touchstart", markPointerDown, true);
          body.addEventListener("touchend", markPointerUp, true);
          body.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
          body.addEventListener("touchend", handleTouchEnd, { passive: false, capture: true });
          body.addEventListener("touchcancel", resetTouchGesture, true);
        });
        if (layout === "reflowable") applyStyles();
        const refreshAnnotationLayers = () => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (cancelled) return;
            rendition.views().forEach((view: any) => view.pane?.render?.());
          }));
        };
        rendition.on("rendered", refreshAnnotationLayers);
        rendition.on("relocated", (location: any) => {
          void persistProgress(location);
          refreshAnnotationLayers();
        });
        rendition.on("selected", (cfiRange: string, contents: any) => {
          pendingSelectionRef.current = { cfiRange, contents };
          if (!pointerIsDownRef.current) window.setTimeout(() => flushPendingSelectionRef.current(), 0);
        });

        setBookmarkCfis(state.bookmarks.map((bookmark) => bookmark.cfi));
        setBookmarks(state.bookmarks);
        setAnnotations(state.annotations);
        annotationsRef.current = state.annotations;
        await rendition.display(state.progress?.cfi ?? undefined);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (cancelled) return;
        for (const annotation of state.annotations) renderAnnotation(rendition, annotation);
        refreshAnnotationLayers();
        const currentCfi = rendition.currentLocation?.()?.start?.cfi;
        if (currentCfi) setCfi(currentCfi);
        setProgress(state.progress?.progression ?? 0);
        setToc((book.navigation?.toc ?? []) as TocEntry[]);

        book.locations.pause = 16;
        void book.locations.generate(1600).then(() => {
          const location = rendition.currentLocation?.();
          const displayedCfi = location?.start?.cfi;
          if (!displayedCfi) return;
          const calculatedProgress = book.locations.percentageFromCfi(displayedCfi);
          if (typeof calculatedProgress === "number") setProgress(calculatedProgress);
          void persistProgress(location);
        }).catch(() => undefined);
      } catch {
        if (!cancelled) setError(reader.openFailed);
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
  }, [applyStyles, closePanels, findAnnotationAtPoint, isOpen, layout, openAnnotationMenu, persistProgress, reader.openFailed, renderAnnotation, slug]);

  useEffect(() => {
    if (!isOpen || !("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then((lock) => { wakeLockRef.current = lock; }).catch(() => undefined);
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [isOpen]);

  const handleReaderKey = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (showSettings || showToc) closePanels();
      else closeReader();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      void renditionRef.current?.prev();
    }
    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      void renditionRef.current?.next();
    }
  }, [closePanels, closeReader, isOpen, showSettings, showToc]);

  useEffect(() => {
    readerKeyHandlerRef.current = handleReaderKey;
  }, [handleReaderKey]);

  useEffect(() => {
    window.addEventListener("keydown", handleReaderKey);
    return () => window.removeEventListener("keydown", handleReaderKey);
  }, [handleReaderKey]);

  useEffect(() => {
    if (!isOpen || (!showSettings && !showToc)) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (headerRef.current?.contains(target) || settingsPanelRef.current?.contains(target) || tocPanelRef.current?.contains(target)) return;
      closePanels();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [closePanels, isOpen, showSettings, showToc]);

  const openToc = async (href: string) => {
    await renditionRef.current?.display(href);
    setShowToc(false);
  };

  const removeBookmark = async (bookmark: ReaderState["bookmarks"][number]) => {
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/bookmarks?id=${encodeURIComponent(bookmark.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setBookmarkMessage(reader.bookmarkDeleteFailed);
      return;
    }
    setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
    setBookmarkCfis((current) => current.filter((item) => item !== bookmark.cfi));
    setBookmarkMessage(reader.bookmarkDeleted);
  };

  const toggleBookmark = async () => {
    const currentCfi = cfi ?? renditionRef.current?.currentLocation?.()?.start?.cfi;
    if (!currentCfi) {
      setBookmarkMessage(reader.noLocation);
      return;
    }
    const existing = bookmarks.find((bookmark) => bookmark.cfi === currentCfi);
    if (existing) {
      await removeBookmark(existing);
      return;
    }
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cfi: currentCfi, label: title }),
    });
    if (response.ok) {
      const bookmark = await response.json() as ReaderState["bookmarks"][number];
      setBookmarkCfis((current) => [...current, currentCfi]);
      setBookmarks((current) => [...current, bookmark]);
      setBookmarkMessage(reader.bookmarkSaved);
    } else {
      setBookmarkMessage(reader.bookmarkSaveFailed);
    }
  };

  const removeAnnotation = async (annotation: ReaderState["annotations"][number]) => {
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations?id=${encodeURIComponent(annotation.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setBookmarkMessage(reader.highlightDeleteFailed);
      return;
    }
    renditionRef.current?.annotations.remove(annotation.cfiRange, "highlight");
    setAnnotations((current) => current.filter((item) => item.id !== annotation.id));
    setAnnotationMenu(null);
    setAnnotationNoteEditorOpen(false);
    setBookmarkMessage(reader.highlightDeleted);
  };

  const saveSelectionAnnotation = async (note: string | null) => {
    if (!selectionMenu) return;
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cfiRange: selectionMenu.cfiRange,
        excerpt: selectionMenu.excerpt,
        note,
        color: "lilah",
      }),
    });
    if (!response.ok) {
      setBookmarkMessage(reader.highlightSaveFailed);
      return;
    }
    const annotation = await response.json() as ReaderState["annotations"][number];
    setAnnotations((current) => [...current, annotation]);
    renderAnnotation(renditionRef.current, annotation);
    setSelectionMenu(null);
    setNoteEditorOpen(false);
    setBookmarkMessage(note ? reader.noteSaved : reader.highlightSaved);
  };

  const clearAnnotationNote = async (annotation: ReaderState["annotations"][number]) => {
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: annotation.id, note: null }),
    });
    if (!response.ok) {
      setBookmarkMessage(reader.noteDeleteFailed);
      return;
    }
    const updated = await response.json() as ReaderState["annotations"][number];
    setAnnotations((current) => current.map((item) => item.id === updated.id ? updated : item));
    setAnnotationMenu((current) => current ? { ...current, annotation: updated } : null);
    setBookmarkMessage(reader.noteDeleted);
  };

  const saveAnnotationNote = async (annotation: ReaderState["annotations"][number]) => {
    const note = noteDraft.trim();
    if (!note) return;
    const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/annotations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: annotation.id, note }),
    });
    if (!response.ok) {
      setBookmarkMessage(reader.noteSaveFailed);
      return;
    }
    const updated = await response.json() as ReaderState["annotations"][number];
    setAnnotations((current) => current.map((item) => item.id === updated.id ? updated : item));
    setAnnotationMenu((current) => current ? { ...current, annotation: updated } : null);
    setAnnotationNoteEditorOpen(false);
    setBookmarkMessage(reader.noteSaved);
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
    setSelectionMenu(null);
    setAnnotationMenu(null);
    setNoteEditorOpen(false);
    setAnnotationNoteEditorOpen(false);
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
      <header ref={headerRef} className={`absolute inset-x-0 top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-white/15 bg-onix/95 px-3 transition-transform duration-200 ${controlsVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"}`}>
        <span className="min-w-0 truncate font-semibold">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => togglePanel("toc")} title={reader.contents} aria-label={reader.contents} className="cursor-pointer p-2"><MenuIcon size={24} /></button>
          <button onClick={toggleBookmark} title={isBookmarked ? reader.removeBookmark : reader.addBookmark} aria-label={isBookmarked ? reader.removeBookmark : reader.addBookmark} className="cursor-pointer p-2"><BookmarkIcon size={24} className={isBookmarked ? "fill-lilah text-lilah" : ""} /></button>
          {layout === "reflowable" && <button onClick={() => togglePanel("settings")} title={reader.settings} aria-label={reader.settings} className="cursor-pointer p-2"><Settings2Icon size={24} /></button>}
          <button onClick={closeReader} title={reader.close} aria-label={reader.close} className="cursor-pointer p-2"><Minimize2Icon size={24} /></button>
        </div>
      </header>

      {showSettings && (
        <div ref={settingsPanelRef} className="absolute right-3 top-12 z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-b-lg bg-blackamber p-5 shadow-xl">
          <div className="grid gap-4 text-base">
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.theme}<select value={theme} onChange={(event) => setTheme(event.target.value as ReaderTheme)} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="light">{reader.light}</option><option value="sepia">{reader.sepia}</option><option value="dark">{reader.dark}</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.flow}<select value={flow} onChange={(event) => setFlow(event.target.value as ReaderFlow)} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="paginated">{reader.paginated}</option><option value="scrolled-continuous">{reader.scrolled}</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.font}<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value as "serif" | "sans")} className="cursor-pointer rounded bg-onix px-3 py-2 text-base"><option value="serif">{reader.serif}</option><option value="sans">{reader.sans}</option></select></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.fontSize}<input className="w-full cursor-pointer accent-lilah" type="range" min="80" max="160" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.lineHeight}<input className="w-full cursor-pointer accent-lilah" type="range" min="1.2" max="2.4" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.margin}<input className="w-full cursor-pointer accent-lilah" type="range" min="0" max="80" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></label>
            <label className="grid grid-cols-[7rem_1fr] items-center gap-3">{reader.column}<input className="w-full cursor-pointer accent-lilah" type="range" min="320" max="1200" value={columnWidth} onChange={(event) => setColumnWidth(Number(event.target.value))} /></label>
          </div>
        </div>
      )}

      {showToc && (
        <aside ref={tocPanelRef} className="absolute bottom-0 left-0 top-12 z-40 w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto bg-blackamber p-5 shadow-xl">
          <div className="mb-4 flex gap-2 border-b border-white/15">
            <button onClick={() => setTocTab("contents")} className={`cursor-pointer px-2 pb-2 text-base ${tocTab === "contents" ? "border-b-2 border-lilah text-lilah" : "text-sand"}`}>{reader.contents}</button>
            <button onClick={() => setTocTab("bookmarks")} className={`cursor-pointer px-2 pb-2 text-base ${tocTab === "bookmarks" ? "border-b-2 border-lilah text-lilah" : "text-sand"}`}>{reader.bookmarks} {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}</button>
            <button onClick={() => setTocTab("annotations")} className={`cursor-pointer px-2 pb-2 text-base ${tocTab === "annotations" ? "border-b-2 border-lilah text-lilah" : "text-sand"}`}>{reader.annotations} {annotations.length > 0 ? `(${annotations.length})` : ""}</button>
          </div>
          {tocTab === "contents" ? <>
            <div className="mb-4 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder={reader.searchPlaceholder} className="min-w-0 flex-1 rounded bg-onix px-3 py-2 text-base" /><button onClick={runSearch} aria-label={reader.searchPlaceholder} className="cursor-pointer rounded bg-lilah p-2 text-onix"><SearchIcon size={20} /></button></div>
            {matches.map((match) => <button key={match.cfi} onClick={() => openToc(match.cfi)} className="block w-full cursor-pointer py-2 text-left text-base hover:text-lilah">{match.label}</button>)}
            {toc.map((entry) => <button key={entry.href} onClick={() => openToc(entry.href)} className="block w-full cursor-pointer py-2 text-left text-base hover:text-lilah">{entry.label}</button>)}
          </> : tocTab === "bookmarks" ? <div className="space-y-1">
            {bookmarks.length === 0 ? <p className="py-2 text-base text-neutral-400">{reader.noBookmarks}</p> : bookmarks.map((bookmark) => <div key={bookmark.id} className="flex items-center gap-2 rounded hover:bg-onix"><button onClick={() => openToc(bookmark.cfi)} className="min-w-0 flex-1 cursor-pointer px-2 py-3 text-left text-base hover:text-lilah"><span className="block truncate">{bookmark.chapterLabel || bookmark.label || reader.markedPage}</span><span className="mt-1 block text-sm text-neutral-400">{reader.goToLocation}</span></button><button onClick={() => removeBookmark(bookmark)} title={reader.removeBookmark} aria-label={reader.removeBookmark} className="cursor-pointer p-3 text-neutral-400 hover:text-lilah"><Trash2Icon size={18} /></button></div>)}
          </div> : <div className="space-y-2">
            {annotations.length === 0 ? <p className="py-2 text-base text-neutral-400">{reader.noAnnotations}</p> : annotations.map((annotation) => <div key={annotation.id} className="rounded bg-onix/60 p-3"><button onClick={() => openToc(annotation.cfiRange)} className="block w-full cursor-pointer text-left hover:text-lilah"><span className="block text-base leading-relaxed">{annotation.excerpt || reader.highlightedText}</span><span className="mt-2 block text-sm text-lilah">{reader.goToLocation}</span></button>{annotation.note && <p className="mt-3 border-t border-white/10 pt-3 text-base text-sand"><span className="mr-2 text-sm uppercase text-neutral-400">{reader.note}</span>{annotation.note}</p>}<button onClick={() => removeAnnotation(annotation)} className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-neutral-400 hover:text-lilah"><Trash2Icon size={16} />{reader.deleteHighlight}</button></div>)}
          </div>}
        </aside>
      )}

      {bookmarkMessage && <p className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded bg-blackamber px-3 py-2 text-sm shadow">{bookmarkMessage}</p>}

      {selectionMenu && <div className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-blackamber p-2 shadow-xl" style={{ left: selectionMenu.x, top: selectionMenu.y - 8 }}>
        {noteEditorOpen ? <div className="w-64 space-y-2"><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onKeyDown={(event) => event.stopPropagation()} autoFocus placeholder={reader.writeNote} className="min-h-20 w-full rounded bg-onix p-2 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => { setNoteEditorOpen(false); setNoteDraft(""); }} className="cursor-pointer px-2 py-1 text-sm">{reader.cancel}</button><button onClick={() => saveSelectionAnnotation(noteDraft.trim() || null)} className="cursor-pointer rounded bg-lilah px-3 py-1 text-sm text-pearl">{reader.save}</button></div></div> : <div className="flex items-center gap-1"><button onClick={() => saveSelectionAnnotation(null)} className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-onix">{reader.highlight}</button><button onClick={() => setNoteEditorOpen(true)} className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-onix">{reader.annotate}</button></div>}
      </div>}

      {annotationMenu && <div className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-blackamber p-2 shadow-xl" style={{ left: annotationMenu.x, top: annotationMenu.y - 8 }}>
        {annotationNoteEditorOpen ? <div className="w-64 space-y-2"><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onKeyDown={(event) => event.stopPropagation()} autoFocus placeholder={reader.writeNote} className="min-h-20 w-full rounded bg-onix p-2 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => setAnnotationNoteEditorOpen(false)} className="cursor-pointer px-2 py-1 text-sm">{reader.cancel}</button><button onClick={() => saveAnnotationNote(annotationMenu.annotation)} className="cursor-pointer rounded bg-lilah px-3 py-1 text-sm text-pearl">{reader.save}</button></div></div> : <div className="flex items-center gap-1">
          <button onClick={() => setAnnotationNoteEditorOpen(true)} className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-onix">{annotationMenu.annotation.note ? reader.editNote : reader.annotate}</button>
          {annotationMenu.annotation.note && <button onClick={() => clearAnnotationNote(annotationMenu.annotation)} className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-onix">{reader.deleteNote}</button>}
          <button onClick={() => removeAnnotation(annotationMenu.annotation)} className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-onix">{annotationMenu.annotation.note ? reader.deleteBoth : reader.deleteHighlight}</button>
        </div>}
      </div>}

      <main className="relative h-full w-full touch-pan-y" style={themeStyles[theme]} onPointerUp={(event) => {
        if (event.target === event.currentTarget) {
          closePanels();
          setSelectionMenu(null);
          setAnnotationMenu(null);
          setAnnotationNoteEditorOpen(false);
          setControlsVisible((visible) => !visible);
        }
      }}>
        {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-onix">{reader.opening}</div>}
        {error && <div className="absolute inset-0 z-20 grid place-items-center bg-onix p-6 text-center">{error}</div>}
        <div
          ref={viewerRef}
          className="mx-auto h-full w-full touch-pan-y"
          style={{ maxWidth: flow === "paginated" ? `${(columnWidth + 32) * 2}px` : `${columnWidth}px` }}
        />
      </main>

      <footer className={`absolute inset-x-0 bottom-0 z-30 flex h-11 items-center justify-between gap-4 border-t border-white/15 bg-onix/95 px-3 transition-transform duration-200 ${controlsVisible ? "translate-y-0" : "translate-y-full pointer-events-none"}`}>
        <button onClick={() => renditionRef.current?.prev()} title={reader.previous} aria-label={reader.previous} className="cursor-pointer p-2"><ChevronLeftIcon size={24} /></button>
        <span className="text-sm">{Math.round(progress * 100)}%</span>
        <button onClick={() => renditionRef.current?.next()} title={reader.next} aria-label={reader.next} className="cursor-pointer p-2"><ChevronRightIcon size={24} /></button>
      </footer>
    </div>
  );
}
