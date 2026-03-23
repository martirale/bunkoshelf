"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";

export async function getLibraryFilters() {
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const genres = await prisma.genre.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const tags = await prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { genres, tags };
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error fetching filters:", error);
      return { error: "Error fetching filters", status: 500 };
    }
  }
}

export async function getMangaOverall() {
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const series = await prisma.mangaSeries.findMany({
      include: {
        volumes: true,
      },
    });

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
    error = e;
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
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const series = await prisma.mangaSeries.findMany({
      include: {
        volumes: {
          include: {
            metadataObj: true,
          },
        },
      },
    });

    return { success: true, data: series };
  } catch (e) {
    error = e;
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
  let error;
  try {
    const currentUser = await verifySession();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized",
        status: 401,
      };
    }

    let volumes = await prisma.mangaVolume.findMany({
      include: {
        series: true,
        metadataObj: true,
        usersProgress: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    volumes = sortByPaddedTitle(volumes);

    return { success: true, data: volumes };
  } catch (e) {
    error = e;
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
