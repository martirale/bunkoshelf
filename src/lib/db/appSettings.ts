import { queryOne, execute } from "./query";
import type { ParentalControlMode } from "@/lib/parentalControl";

export interface AppSettings {
  parentalControlEnabled: boolean;
  parentalControlMode: ParentalControlMode;
}

export async function getAppSettings(): Promise<AppSettings> {
  const row = await queryOne<{ parental_control_enabled: boolean; parental_control_mode: ParentalControlMode }>(
    "SELECT parental_control_enabled, parental_control_mode FROM app_settings WHERE id = 'global' LIMIT 1"
  );

  return {
    parentalControlEnabled: row?.parental_control_enabled ?? false,
    parentalControlMode: row?.parental_control_mode ?? "flexible",
  };
}

export async function updateParentalControlEnabled(enabled: boolean, mode: ParentalControlMode): Promise<void> {
  await execute(
    "UPDATE app_settings SET parental_control_enabled = $1, parental_control_mode = $2, updated_at = NOW() WHERE id = 'global'",
    [enabled, mode]
  );
}
