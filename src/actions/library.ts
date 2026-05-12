"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  listLibraryFilters,
  listSeriesWithVolumes,
  listVolumes,
} from "@/lib/db/library";
import { sortByPaddedTitle } from "@/lib/utils";

export async function getLibraryFilters() {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const { genres, tags } = await listLibraryFilters();

    return { genres, tags };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error fetching filters:", error);
      return { error: "Error fetching filters", status: 500 };
    }
  }
}

export async function getMangaOverall() {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const series = await listSeriesWithVolumes();

    const formatted = series.map((s) => {
      if (s.isOneshot && s.volumes.length === 1) {
        return {
          ...s,
          volumeSlug: s.volumes[0].slug,
        };
      }

      return s;
    });

    return { success: true, data: formatted };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error al obtener los datos desde la DB:", error);
      return {
        success: false,
        error: "Error al consultar la base de datos",
        status: 500,
      };
    }
  }
}

export async function getMangaSeries() {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const series = await listSeriesWithVolumes();

    return { success: true, data: series };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error al obtener series:", error);
      return {
        success: false,
        error: "Error al consultar la base de datos",
        status: 500,
      };
    }
  }
}

export async function getMangaVolumes() {
  let error: Error | null = null;
  try {
    const currentUser = await verifySession();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized",
        status: 401,
      };
    }

    let volumes = await listVolumes({
      userId: currentUser.id,
    });

    volumes = sortByPaddedTitle(volumes);

    return { success: true, data: volumes };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) {
      throw e;
    }
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error al obtener volúmenes:", error);
      return {
        success: false,
        error: "Error al consultar la base de datos",
        status: 500,
      };
    }
  }
}
