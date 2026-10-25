import assert from "node:assert/strict";
import test from "node:test";
import { validateLogicalSeries, type LogicalSeriesInput } from "../src/lib/logicalSeries.ts";

const input: LogicalSeriesInput = {
  title: "The Legend of Korra",
  section: "comic",
  members: [{ id: "turf-wars", position: 1 }, { id: "ruins", position: 2 }],
};

test("accepts ordered physical series in every library", () => {
  for (const section of ["manga", "comic", "other", "books"] as const) {
    assert.equal(validateLogicalSeries({ ...input, section }), true);
  }
});

test("accepts custom order independent of selection order", () => {
  assert.equal(validateLogicalSeries({ ...input, members: [{ id: "ruins", position: 20 }, { id: "turf-wars", position: 10 }] }), true);
});

test("rejects repeated series and positions", () => {
  assert.equal(validateLogicalSeries({ ...input, members: [{ id: "turf-wars", position: 1 }, { id: "turf-wars", position: 2 }] }), false);
  assert.equal(validateLogicalSeries({ ...input, members: [{ id: "turf-wars", position: 1 }, { id: "ruins", position: 1 }] }), false);
});

test("rejects invalid positions before sending them to PostgreSQL", () => {
  for (const position of [0, -1, 1.5, NaN, Infinity, 2147483648]) {
    assert.equal(validateLogicalSeries({ ...input, members: [{ id: "turf-wars", position }, { id: "ruins", position: 2 }] }), false);
  }
});

test("requires a title and at least two members", () => {
  assert.equal(validateLogicalSeries({ ...input, title: "   " }), false);
  assert.equal(validateLogicalSeries({ ...input, title: "a".repeat(201) }), false);
  assert.equal(validateLogicalSeries({ ...input, members: input.members.slice(0, 1) }), false);
});

test("rejects malformed server action payloads", () => {
  for (const value of [null, {}, { ...input, members: [null] }, { ...input, section: "invalid" }]) {
    assert.equal(validateLogicalSeries(value as LogicalSeriesInput), false);
  }
});
