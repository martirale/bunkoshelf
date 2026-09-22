import assert from "node:assert/strict";
import test from "node:test";
import { canViewAgeRating, getContentVisibilityPolicy } from "../src/lib/parentalControl.ts";
import type { Session } from "../src/lib/types/auth.ts";

function user(overrides: Partial<Session> = {}): Session {
  return {
    id: "user",
    username: "reader",
    isAdmin: false,
    role: "MEMBER",
    name: null,
    lastname: null,
    birthYear: 2000,
    birthMonth: 1,
    birthDay: 1,
    parentalControlEnabled: false,
    parentalControlMode: "flexible",
    profileImage: null,
    ...overrides,
  };
}

test("ajusta la mayoría de edad el día exacto del cumpleaños", () => {
  const minor = user({ birthYear: 2008, birthMonth: 9, birthDay: 16 });
  assert.equal(getContentVisibilityPolicy(minor, true, "flexible", new Date(2026, 8, 15)).maxAge, 17);
  assert.equal(getContentVisibilityPolicy(minor, true, "flexible", new Date(2026, 8, 16)).enabled, false);
});

test("aplica los modos flexible, estricto y fecha ausente", () => {
  const flexible = getContentVisibilityPolicy(user({ parentalControlEnabled: true }), true);
  const strict = getContentVisibilityPolicy(user({ parentalControlEnabled: true, parentalControlMode: "strict" }), true);
  const missingDate = getContentVisibilityPolicy(user({ birthYear: null, birthMonth: null, birthDay: null }), true);
  assert.equal(canViewAgeRating("17+", "book", flexible), true);
  assert.equal(canViewAgeRating("18+", "book", flexible), false);
  assert.equal(canViewAgeRating("Mature 17+", "manga", strict), false);
  assert.equal(canViewAgeRating(null, "manga", strict), false);
  assert.equal(missingDate.maxAge, 15);
});

test("aplica el nivel global a invitados", () => {
  const guest = user({ role: "GUEST", birthYear: null, birthMonth: null, birthDay: null });
  const flexible = getContentVisibilityPolicy(guest, true, "flexible");
  const strict = getContentVisibilityPolicy(guest, true, "strict");
  assert.equal(flexible.maxAge, 17);
  assert.equal(flexible.allowUnrated, true);
  assert.equal(strict.maxAge, 15);
  assert.equal(strict.allowUnrated, false);
});

test("acepta 29 de febrero en años bisiestos", () => {
  const leapDayUser = user({ birthYear: 2008, birthMonth: 2, birthDay: 29 });
  assert.equal(getContentVisibilityPolicy(leapDayUser, true, "flexible", new Date(2026, 1, 28)).maxAge, 17);
  assert.equal(getContentVisibilityPolicy(leapDayUser, true, "flexible", new Date(2026, 2, 1)).enabled, false);
});

test("el nivel global estricto no anula preferencias de adultos", () => {
  const unfiltered = getContentVisibilityPolicy(user({ parentalControlEnabled: false }), true, "strict");
  const flexible = getContentVisibilityPolicy(user({ parentalControlEnabled: true }), true, "strict");
  const strict = getContentVisibilityPolicy(user({ parentalControlEnabled: true, parentalControlMode: "strict" }), true, "strict");
  assert.equal(unfiltered.enabled, false);
  assert.equal(flexible.maxAge, 17);
  assert.equal(strict.maxAge, 15);
});
