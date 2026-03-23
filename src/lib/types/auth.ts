import type { User } from "@prisma/client";

export type Session = Pick<
  User,
  "id" | "username" | "isAdmin" | "role" | "name" | "lastname" | "birthYear"
>;

export type Role = "ADMIN" | "MEMBER" | "GUEST";

export type Permission =
  | "users:manage"
  | "settings:access"
  | "library:scan"
  | "logs:view"
  | "logs:clear"
  | "db:download"
  | "upload:library"
  | "library:read"
  | "progress:manage"
  | "favorites:manage"
  | "ratings:manage"
  | "reading:manage"
  | "challenges:manage"
  | "push:subscribe"
  | "profile:edit"
  | "library:browse";
