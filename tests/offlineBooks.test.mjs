import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { canViewAgeRating } from "../src/lib/parentalControl.ts";

function load(path, dependencies, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const script = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(script, {
    exports, require: (name) => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports;
}

function memoryDatabase() {
  const stores = new Map(["volumes", "pages", "downloads", "operations"].map((name) => [name, new Map()]));
  function request(value) {
    const result = { result: value };
    queueMicrotask(() => result.onsuccess?.());
    return result;
  }
  const db = {
    close() {},
    transaction() {
      const tx = {
        objectStore(name) {
          const store = stores.get(name);
          const byUser = (userId) => [...store.values()].filter((value) => value.userId === userId);
          return {
            get: (key) => request(store.get(key)),
            put: (value) => store.set(value.key ?? value.id, structuredClone(value)),
            delete: (key) => store.delete(key),
            index: () => ({
              getAll: (userId) => request(byUser(userId)),
              getAllKeys: ([userId, volumeId]) => request(byUser(userId).filter((value) => value.volumeId === volumeId).map((value) => value.key)),
            }),
          };
        },
      };
      setImmediate(() => tx.oncomplete?.());
      return tx;
    },
  };
  return {
    indexedDB: { open: () => request(db) },
    stores,
  };
}

test("EPUB downloads keep a user-scoped file, local progress, and queued sync", async () => {
  const { indexedDB, stores } = memoryDatabase();
  const file = new Blob(["EPUB fixture"], { type: "application/epub+zip" });
  const requests = [];
  const library = load("../src/lib/client/offlineLibrary.ts", {
    "@/lib/parentalControl": { canViewAgeRating },
    epubjs: {},
  }, {
    indexedDB, navigator: { onLine: true }, window: new EventTarget(), Event, crypto,
    fetch: async (url, options) => {
      requests.push(String(url));
      if (url === "/api/offline/sync") {
        const { operations } = JSON.parse(options.body);
        assert.equal(operations.length, 1);
        assert.equal(operations[0].kind, "book-progress");
        assert.equal(operations[0].payload.slug, "sample");
        assert.equal(operations[0].payload.cfi, "epubcfi(/6/4)");
        return Response.json({ completed: [operations[0].id] });
      }
      return new Response(file);
    },
  });
  const manifest = {
    id: "book", slug: "sample", title: "Sample", section: "books",
    series: { id: "series", slug: "series", title: "Series", isOneshot: false },
    book: { number: 1, state: { progress: null, bookmarks: [], annotations: [] } },
    metadata: { ageRating: "13+" }, coverUrl: null, totalPages: 1,
  };
  await Promise.all([library.downloadOfflineVolume("alice", manifest), library.downloadOfflineVolume("alice", manifest)]);
  assert.deepEqual(requests, ["/api/reader/books/sample/file"]);
  assert.equal(await (await library.getOfflineBookFile("alice", "book")).text(), "EPUB fixture");
  assert.equal(await library.getOfflineBookFile("bob", "book"), null);
  const position = { cfi: "epubcfi(/6/4)", progression: 0.4, lastReadAt: "2026-01-03T00:00:00.000Z" };
  await library.saveOfflineBookState("alice", "book", position, position);
  await library.saveOfflineBookState("alice", "book", { cfi: "old", lastReadAt: "2026-01-02T00:00:00.000Z" });
  assert.equal((await library.getOfflineVolume("alice", "book")).book.state.progress.cfi, position.cfi);
  await Promise.all([library.flushOfflineOperations("alice"), library.flushOfflineOperations("alice")]);
  assert.equal(requests.filter((url) => url === "/api/offline/sync").length, 1);
  assert.equal(stores.get("operations").size, 0);

  await library.purgeRestrictedVolumes("alice", { enabled: true, maxAge: 12, allowUnrated: false });
  assert.equal(await library.getOfflineBookFile("alice", "book"), null);
  assert.equal(stores.get("pages").size, 0);
  assert.equal(await library.getOfflineVolume("alice", "book"), null);
});

test("sync applies EPUB locations for the session and keeps a newer server position", async () => {
  const saved = [];
  let current = null;
  const user = { id: "alice" };
  const { POST } = load("../src/app/api/offline/sync/route.ts", {
    "next/server": { NextResponse: { json: Response.json.bind(Response) } },
    "@paralleldrive/cuid2": { createId: () => "id" },
    "@/lib/auth/verifySession": { verifySession: async () => user },
    "@/lib/clubs/access": { canAccessBookVolume: async (session, id) => session === user && id === "book" },
    "@/lib/db/clubs": { recordClubProgressActivities: async () => {} },
    "@/lib/db/books/library": { findBookVolumeBySlug: async () => ({ id: "book", series: { id: "series" } }) },
    "@/lib/db/books/reading": {
      findBookProgress: async () => current,
      upsertBookProgress: async (...args) => saved.push(args),
    },
    "@/lib/db/query": { queryOne: async () => null, execute: async () => {} },
    "@/actions/favorites": {},
    "@/actions/rating": {},
    "@/actions/books-rating": {},
    "@/lib/db/library": {},
    "@/actions/read": {},
    "@/actions/progress": {},
  });
  const sync = (id) => POST({ json: async () => ({ operations: [{
    id, kind: "book-progress", payload: {
      slug: "sample", cfi: "epubcfi(/6/4)", chapterHref: "chapter.xhtml", progression: 0.4,
      lastReadAt: "2026-01-03T00:00:00.000Z", readingDate: "2026-01-02",
    },
  }] }) });
  assert.deepEqual(await (await sync("new")).json(), { completed: ["new"] });
  assert.equal(saved[0][0], "alice");
  assert.equal(saved[0][1], "book");
  assert.equal(saved[0][2].progression, 0.4);
  assert.equal(saved[0][2].readingDate, "2026-01-02");
  current = { lastReadAt: new Date("2026-01-04T00:00:00.000Z") };
  assert.deepEqual(await (await sync("old")).json(), { completed: ["old"] });
  assert.equal(saved.length, 1);
});

test("the service worker caches the EPUB reader chunk and reopens the local library shell", async () => {
  const listeners = new Map();
  const origin = "https://bunko.test";
  const chunk = "/_next/static/chunks/reader.js";
  const books = "/en/books/volume/sample";
  const assets = new Map();
  const pages = new Map();
  const key = (request) => typeof request === "string" ? new URL(request, origin).href : request.url;
  let online = true;
  runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    URL, Response,
    self: { location: { origin }, addEventListener: (name, callback) => listeners.set(name, callback) },
    fetch: async ({ url }) => {
      if (!online) throw new Error("Offline");
      return new Response(url.endsWith(chunk) ? "epub-reader" : "app-shell");
    },
    caches: {
      open: async (name) => {
        const store = name.startsWith("bunko-assets") ? assets : pages;
        return {
          put: async (request, response) => store.set(key(request), response),
          match: async (request) => store.get(key(request))?.clone(),
          keys: async () => [...store.keys()].map((url) => ({ url })),
        };
      },
    },
  });
  async function request(path, mode) {
    const pending = [];
    let response;
    listeners.get("fetch")({
      request: { url: origin + path, method: "GET", mode },
      respondWith: (value) => { response = value; },
      waitUntil: (value) => pending.push(value),
    });
    const result = await response;
    await Promise.all(pending);
    return result.text();
  }
  await request(chunk, "cors");
  await request(books, "navigate");
  online = false;
  assert.equal(await request(chunk, "cors"), "epub-reader");
  assert.equal(await request("/en/books/series", "navigate"), "app-shell");
});

test("comic progress and ratings persist across reopening and sync independently", async () => {
  const { indexedDB, stores } = memoryDatabase();
  const library = load("../src/lib/client/offlineLibrary.ts", {
    "@/lib/parentalControl": { canViewAgeRating },
  }, { indexedDB, window: new EventTarget(), Event, crypto });
  stores.get("volumes").set("alice:comic", {
    key: "alice:comic", userId: "alice", id: "comic", section: "comic", slug: "first",
    lastPage: 0, totalPages: 20, isRead: false,
  });
  const save = (lastPage, seconds) => library.saveOfflineMangaProgress("alice", "comic", {
    lastPage, totalPages: 20, lastReadAt: `2026-01-03T00:00:${seconds}.000Z`, date: "2026-01-02",
  }, true);

  await save(4, "01");
  await save(10, "02");
  assert.equal((await library.getOfflineVolume("alice", "comic")).lastPage, 10);
  assert.equal(stores.get("operations").size, 1);
  await save(4, "01");
  assert.equal((await library.getOfflineVolume("alice", "comic")).lastPage, 10);
  await save(19, "03");
  await save(18, "04");
  await library.saveOfflineRating("alice", "comic", 8.5, true);
  await library.saveOfflineRating("alice", "comic", null, true);
  const volume = await library.getOfflineVolume("alice", "comic");
  assert.equal(volume.lastPage, 18);
  assert.equal(volume.personalRating, null);
  const operations = [...stores.get("operations").values()];
  assert.deepEqual(operations.map((operation) => operation.kind), ["progress", "progress", "volume-rating", "volume-rating"]);
  assert.deepEqual(operations.slice(0, 2).map((operation) => operation.payload.lastPage), [19, 18]);
  assert.deepEqual(operations.slice(2).map((operation) => operation.payload.rating), [8.5, null]);
});

test("a series reports progress throughout its downloads and ignores duplicate starts", async () => {
  const { indexedDB } = memoryDatabase();
  const events = new EventTarget();
  const urls = [];
  let release;
  const manifestResponse = new Promise((resolve) => { release = resolve; });
  const library = load("../src/lib/client/offlineLibrary.ts", {
    "@/lib/parentalControl": { canViewAgeRating }, epubjs: {},
  }, {
    indexedDB, window: events, Event, navigator: { onLine: true },
    fetch: async (url) => {
      urls.push(url);
      if (url.includes("/series/")) return manifestResponse;
      return new Response(new Blob(["EPUB"]));
    },
  });

  const snapshot = () => library.getSeriesDownload("alice", "books", "sample");
  const seen = [];
  events.addEventListener("bunko:series-download", () => seen.push(snapshot()));
  const first = library.downloadSeriesBySlug("alice", "books", "sample");
  await library.downloadSeriesBySlug("alice", "books", "sample");
  assert.equal(snapshot().completed, 0);
  assert.deepEqual(urls, ["/api/offline/library/books/series/sample"]);
  release(Response.json({ volumes: ["first", "second"].map((id) => ({
    id, slug: id, section: "books", series: { id: "series" }, book: {},
  })) }));
  await first;
  assert.ok(seen.some((progress) => progress?.total === 2 && progress.completed === 1));
  assert.ok(seen.some((progress) => progress?.total === 2 && progress.completed === 2));
  assert.equal(snapshot(), undefined);
  assert.equal(urls.length, 3);
});

test("the offline sync endpoint applies and clears ratings for the correct volume and library", async () => {
  const ratings = [];
  const { POST } = load("../src/app/api/offline/sync/route.ts", {
    "next/server": { NextResponse: { json: Response.json.bind(Response) } },
    "@paralleldrive/cuid2": { createId: () => "id" },
    "@/lib/auth/verifySession": { verifySession: async () => ({ id: "alice" }) },
    "@/lib/clubs/access": {
      canAccessBookVolume: async () => true,
      canAccessLibraryVolume: async (_user, id) => id !== "hidden",
    },
    "@/lib/db/clubs": {},
    "@/lib/db/library": { findVolumeBySlug: async ({ slug }) => ({ id: slug }) },
    "@/lib/db/books/library": { findBookVolumeBySlug: async (slug) => ({ id: slug }) },
    "@/lib/db/books/reading": {},
    "@/lib/db/query": { queryOne: async () => null, execute: async () => {} },
    "@/actions/rating": { updatePersonalRating: async (rating) => { ratings.push(["comic", rating]); return { success: true }; } },
    "@/actions/books-rating": { updateBookRating: async (rating) => { ratings.push(["book", rating]); return { success: true }; } },
    "@/actions/favorites": {}, "@/actions/read": {}, "@/actions/progress": {},
  });
  const operation = (id, kind, volumeId, rating) => ({ id, kind, payload: { volumeSlug: volumeId, volumeId, rating } });
  const response = await POST({ json: async () => ({ operations: [
    operation("1", "volume-rating", "comic", 8.5),
    operation("2", "book-rating", "book", null),
    operation("3", "volume-rating", "hidden", 9),
    operation("4", "book-rating", "book", "9"),
  ] }) });
  assert.deepEqual(await response.json(), { completed: ["1", "2"] });
  assert.deepEqual(JSON.parse(JSON.stringify(ratings)), [
    ["comic", { volumeId: "comic", rating: 8.5 }],
    ["book", { volumeId: "book", rating: null }],
  ]);
});
