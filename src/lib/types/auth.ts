export type Role = "ADMIN" | "MEMBER" | "GUEST";

export interface Session {
  id: string;
  username: string;
  isAdmin: boolean;
  role: Role;
  name: string | null;
  lastname: string | null;
  birthYear: number | null;
}

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
