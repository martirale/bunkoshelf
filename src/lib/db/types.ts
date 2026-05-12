import type { Role } from "@/lib/types/auth";

export interface UserRow {
  id: string;
  created_at: Date;
  username: string;
  password: string;
  is_admin: boolean;
  role: Role;
  name: string | null;
  lastname: string | null;
  birth_year: number | null;
}

export interface PublicUser {
  id: string;
  username: string;
  isAdmin: boolean;
  role: Role;
  name: string | null;
  lastname: string | null;
  birthYear: number | null;
}
