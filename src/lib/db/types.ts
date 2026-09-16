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
  birth_month: number | null;
  birth_day: number | null;
  parental_control_enabled: boolean;
  parental_control_mode: "flexible" | "strict";
  profile_image: string | null;
}

export interface PublicUser {
  id: string;
  username: string;
  isAdmin: boolean;
  role: Role;
  name: string | null;
  lastname: string | null;
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  parentalControlEnabled: boolean;
  parentalControlMode: "flexible" | "strict";
  profileImage: string | null;
}
