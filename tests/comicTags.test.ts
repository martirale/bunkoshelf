import assert from "node:assert/strict";
import test from "node:test";
import { getComicTagAliases } from "../src/lib/comicTags.ts";

test("matches comic categories in both languages regardless of case", () => {
  for (const tag of ["Cómic", "comic", "COMIC"]) {
    assert.deepEqual(getComicTagAliases(tag), ["cómic", "comic"]);
  }
  for (const tag of ["Novela Gráfica", "graphic novel", " GRAPHIC NOVEL "]) {
    assert.deepEqual(getComicTagAliases(tag), ["novela gráfica", "graphic novel"]);
  }
  assert.deepEqual(getComicTagAliases("Manhwa"), ["manhwa"]);
  for (const tag of ["Manhua", " MANHUA ", "manhua"]) {
    assert.deepEqual(getComicTagAliases(tag), ["manhua"]);
  }
});

test("keeps unrelated tags out of comic category matching", () => {
  for (const tag of ["shonen", "adventure", "novel", ""]) {
    assert.equal(getComicTagAliases(tag), undefined);
  }
});
