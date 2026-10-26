import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSeriesRelations } from "../src/lib/seriesMetadata.ts";
import { aggregateBookSeriesMetadata } from "../src/lib/books/seriesMetadata.ts";

type BookMetadata = Parameters<typeof aggregateBookSeriesMetadata>[0][number];

function bookMetadata(overrides: Partial<BookMetadata> = {}): BookMetadata {
  return { people: [], subjects: [], identifiers: [], publisher: null, rights: null, source: null, epubVersion: null, publicationType: null, ...overrides };
}

test("combines genres and tags from every member without duplicate or blank names", () => {
  const result = aggregateSeriesRelations([
    { genres: ["Adventure", " Fantasy "], tags: ["Avatar", "   "] },
    { genres: ["fantasy", "Drama"], tags: ["avatar", "Politics"] },
  ]);
  assert.deepEqual(result.genres, [{ name: "Adventure" }, { name: "Fantasy" }, { name: "Drama" }]);
  assert.deepEqual(result.tags, [{ name: "Avatar" }, { name: "Politics" }]);
});

test("includes metadata after the first page even when the first volume has none", () => {
  const volumes = Array.from({ length: 100 }, () => ({ genres: [] as string[], tags: [] as string[] }));
  volumes[99] = { genres: ["Late genre"], tags: ["Late tag"] };
  assert.deepEqual(aggregateSeriesRelations(volumes), { genres: [{ name: "Late genre" }], tags: [{ name: "Late tag" }] });
});

test("logical book details combine authors, contributors, publishers and subjects", () => {
  const result = aggregateBookSeriesMetadata([
    bookMetadata({
      people: [{ name: "First Author", kind: "creator", role: null, sortName: null, position: 0 }],
      publisher: "First Publisher", subjects: [{ name: "Fantasy", scheme: null }],
    }),
    bookMetadata({
      people: [
        { name: "Second Author", kind: "creator", role: "aut", sortName: null, position: 0 },
        { name: "Illustrator", kind: "contributor", role: "ill", sortName: null, position: 1 },
      ],
      publisher: "Second Publisher", subjects: [{ name: "Drama", scheme: null }],
    }),
  ]);
  assert.deepEqual(result.people.map((person) => person.name), ["First Author", "Second Author", "Illustrator"]);
  assert.equal(result.publisher, "First Publisher, Second Publisher");
  assert.deepEqual(result.subjects.map((subject) => subject.name), ["Fantasy", "Drama"]);
});

test("deduplicates book details while preserving different contributor roles", () => {
  const result = aggregateBookSeriesMetadata([
    bookMetadata({ people: [{ name: " Author ", kind: "creator", role: null, sortName: null, position: 0 }], publisher: " Publisher ", subjects: [{ name: " Fantasy ", scheme: null }] }),
    bookMetadata({ people: [
      { name: "Author", kind: "creator", role: "AUT", sortName: null, position: 0 },
      { name: "Author", kind: "contributor", role: "ill", sortName: null, position: 1 },
    ], publisher: "Publisher", subjects: [{ name: "fantasy", scheme: null }] }),
  ]);
  assert.equal(result.people.length, 2);
  assert.equal(result.people[1].role, "ill");
  assert.equal(result.publisher, "Publisher");
  assert.deepEqual(result.subjects, [{ name: "Fantasy", scheme: null }]);
});

test("includes identifiers, rights, sources and EPUB formats from later books", () => {
  const first = bookMetadata({ identifiers: [{ value: "111", scheme: "ISBN", isPrimary: true }], rights: "First rights", source: "First source", epubVersion: "2" });
  const second = bookMetadata({ identifiers: [{ value: "111", scheme: "isbn", isPrimary: true }, { value: "222", scheme: "ISBN", isPrimary: true }], rights: "Second rights", source: "Second source", epubVersion: "3", publicationType: "novel" });
  const result = aggregateBookSeriesMetadata([first, second]);
  assert.deepEqual(result.identifiers.map((identifier) => identifier.value), ["111", "222"]);
  assert.equal(result.rights, "First rights, Second rights");
  assert.equal(result.source, "First source, Second source");
  assert.deepEqual(result.formats, ["EPUB 2", "EPUB 3 · novel"]);
});

test("aggregation preserves original volume metadata", () => {
  const relations = [{ genres: [" Fantasy "], tags: [" Avatar "] }];
  const volumes = [bookMetadata({ people: [{ name: " Author ", kind: "creator", role: "AUT", sortName: null, position: 0 }], subjects: [{ name: " Fantasy ", scheme: null }] })];
  const original = JSON.stringify({ relations, volumes });
  aggregateSeriesRelations(relations);
  aggregateBookSeriesMetadata(volumes);
  assert.equal(JSON.stringify({ relations, volumes }), original);
});

test("empty series metadata remains empty", () => {
  assert.deepEqual(aggregateSeriesRelations([]), { genres: [], tags: [] });
  assert.deepEqual(aggregateBookSeriesMetadata([]), { people: [], subjects: [], identifiers: [], publisher: null, rights: null, source: null, formats: [] });
});
