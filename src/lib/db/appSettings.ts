import { cacheLife, cacheTag } from "next/cache";
import { execute, queryOne } from "./query";

export const APP_SETTINGS_TAG = "app-settings";
const APP_SETTINGS_ID = "global";

export interface AppSettings {
  othersLibraryEnabled: boolean;
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureAppSettingsRow() {
  if (!hasDatabaseUrl()) {
    return;
  }

  await execute(
    `
      INSERT INTO app_settings (id, others_library_enabled)
      VALUES ($1, FALSE)
      ON CONFLICT (id) DO NOTHING
    `,
    [APP_SETTINGS_ID]
  );
}

async function getAppSettingsRaw(): Promise<AppSettings> {
  if (!hasDatabaseUrl()) {
    return {
      othersLibraryEnabled: false,
    };
  }

  await ensureAppSettingsRow();

  const row = await queryOne<{ others_library_enabled: boolean }>(
    `
      SELECT others_library_enabled
      FROM app_settings
      WHERE id = $1
      LIMIT 1
    `,
    [APP_SETTINGS_ID]
  );

  return {
    othersLibraryEnabled: row?.others_library_enabled ?? false,
  };
}

async function getAppSettingsCached() {
  "use cache";

  cacheLife("max");
  cacheTag(APP_SETTINGS_TAG);

  return getAppSettingsRaw();
}

export async function getAppSettings(): Promise<AppSettings> {
  return getAppSettingsCached();
}

export async function updateOthersLibraryEnabled(enabled: boolean) {
  await execute(
    `
      INSERT INTO app_settings (id, others_library_enabled, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET others_library_enabled = EXCLUDED.others_library_enabled,
          updated_at = NOW()
    `,
    [APP_SETTINGS_ID, enabled]
  );
}

export async function isOthersLibraryEnabled() {
  const settings = await getAppSettings();
  return settings.othersLibraryEnabled;
}
