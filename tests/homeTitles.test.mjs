import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { createElement } from "react";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getComicTitle } from "../src/lib/comicTitles.ts";
import * as librarySection from "../src/lib/librarySection.ts";

const intl = { home: {}, libraries: { keepReading: "Keep reading", recentlyAdded: "Recently added" } };
const empty = { __esModule: true, default: () => null };
const shared = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "@/lib/comicTitles": { getComicTitle },
  "@/lib/librarySection": librarySection,
  "@/components/ui/MangaCard": { __esModule: true, default: ({ title }) => createElement("span", null, title) },
  "next/link": { __esModule: true, default: ({ children }) => children },
};

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports, process: { env: {} },
    require: (name) => dependencies[name] ?? shared[name] ?? empty,
  });
  return exports.default;
}

function descendants(element) {
  if (!element || typeof element !== "object") return [];
  const children = [element.props?.children].flat(Infinity);
  return [element, ...children.flatMap(descendants)];
}

test("home data preserves AltTitle for both keep reading and recent works", async () => {
  for (const section of ["manga", "comic", "other"]) {
    const volume = {
      title: "Filename", slug: "volume", createdAt: new Date(),
      series: { librarySection: section, isOneshot: false },
      metadataObj: { title: "Original title", altTitle: "Alternate title" },
      usersProgress: [{ lastPage: 4, totalPages: 10, lastReadAt: new Date() }],
    };
    const HomePage = load("../src/app/[lang]/page.tsx", {
      "next/server": { connection: async () => {} },
      "@/actions/library": { getMangaVolumes: async () => ({ success: true, data: [volume] }) },
      "@/actions/stats": { getReaderStats: async () => ({}) },
      "@/lib/db/books/library": { listRecentlyAddedBooks: async () => [] },
      "@/lib/auth/verifySession": { verifySession: async () => null },
      "@/lib/i18n/Dictionary": { getDictionary: async () => intl },
      "@/lib/mangaCover": { getMangaCoverUrl: () => null },
      "@/lib/reader/readingProgress": { getVolumeProgressRatio: () => 0.5 },
      clsx: { __esModule: true, default: (...classes) => classes.join(" ") },
    });
    const root = await HomePage({ params: Promise.resolve({ lang: "es" }) });
    const content = root.props.children;
    const tree = await content.type(content.props);
    const elements = descendants(tree);
    const active = elements.find((element) => element.props?.entry)?.props.entry;
    const recent = elements.find((element) => element.props?.entries)?.props.entries[0];
    for (const entry of [active, recent]) {
      assert.equal(entry.meta.title, "Original title");
      assert.equal(entry.meta.altTitle, "Alternate title");
      assert.equal(entry.section, librarySection.getLibrarySection(section));
    }
  }
});

test("home cards prefer AltTitle and preserve original and filename fallbacks", () => {
  const Hero = load("../src/components/home/manga/HeroKeepRead.tsx");
  const Carousel = load("../src/components/home/manga/RowNewVolsCarousel.tsx");
  for (const [meta, expected] of [
    [{ title: "Original title", altTitle: " Alternate title " }, "Alternate title"],
    [{ title: "Original title" }, "Original title"],
    [{ title: "Original title", altTitle: " " }, "Original title"],
    [null, "Filename"],
  ]) {
    const entry = { title: "Filename", slug: "volume", section: "manga", meta, totalPages: 10, lastPage: 4 };
    for (const element of [createElement(Hero, { intl, lang: "es", entry }), createElement(Carousel, { intl, lang: "es", entries: [entry] })]) {
      const html = renderToStaticMarkup(element);
      assert.ok(html.includes(`<span>${expected}</span>`));
      if (expected === "Alternate title") assert.ok(!html.includes("Original title"));
    }
  }
});
