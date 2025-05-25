import MiniSearch from "minisearch";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([], { status: 200 });
  }

  // Cargar todos los volúmenes para obtener escritores y metadata
  const volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
      metadataObj: true,
    },
  });

  // Crear mapas para writer y nombre completo (series) por seriesId
  const writerBySeriesId = new Map();
  const seriesNameById = new Map();

  for (const vol of volumes) {
    const writer = vol.metadataObj?.writer?.trim();
    const seriesName = vol.metadataObj?.series?.trim();

    if (writer && !writerBySeriesId.has(vol.seriesId)) {
      writerBySeriesId.set(vol.seriesId, writer);
    }
    if (seriesName && !seriesNameById.has(vol.seriesId)) {
      seriesNameById.set(vol.seriesId, seriesName);
    }
  }

  // Buscar series
  const seriesList = await prisma.mangaSeries.findMany();

  // Crear documentos de series, incluyendo writer y nombre completo de serie
  const seriesDocs = seriesList.map((s) => ({
    id: `series-${s.id}`,
    title: s.title,
    slug: s.slug,
    isOneshot: s.isOneshot,
    writer: writerBySeriesId.get(s.id) || "",
    series: seriesNameById.get(s.id) || s.title, // Aquí asignamos el nombre completo
  }));

  const seriesMap = new Map(seriesDocs.map((s) => [s.id, s]));

  const seriesSearch = new MiniSearch({
    fields: ["title"],
    storeFields: ["id", "title", "slug", "isOneshot", "writer", "series"],
  });

  seriesSearch.addAll(seriesDocs);

  const foundSeries = seriesSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const seriesResults = foundSeries.map((res) => {
    const doc = seriesMap.get(res.id);
    return {
      id: doc.id,
      type: "series",
      title: doc.title,
      slug: doc.slug,
      isOneshot: doc.isOneshot,
      writer: doc.writer,
      series: doc.series,
      score: res.score,
    };
  });

  // Crear documentos de volúmenes para búsqueda y resultados
  const volumeDocs = volumes.map((vol) => ({
    id: `volume-${vol.id}`,
    title: vol.metadataObj?.title || "",
    writer: vol.metadataObj?.writer || "",
    series: vol.metadataObj?.series || "",
    slug: vol.slug,
    isOneshot: vol.series?.isOneshot ?? false,
  }));

  const volumesMap = new Map(volumeDocs.map((doc) => [doc.id, doc]));

  const volumeSearch = new MiniSearch({
    fields: ["title", "writer", "series", "slug"],
    storeFields: ["id", "isOneshot"],
  });

  volumeSearch.addAll(volumeDocs);

  const foundVolumes = volumeSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const volumeResults = foundVolumes.map((res) => {
    const doc = volumesMap.get(res.id);
    return {
      id: doc.id,
      type: "volume",
      title: doc.title,
      writer: doc.writer,
      series: doc.series,
      slug: doc.slug,
      isOneshot: doc.isOneshot,
      score: res.score,
    };
  });

  // Combinar resultados: series primero, luego volúmenes
  const allResults = [...seriesResults, ...volumeResults];

  return NextResponse.json(allResults);
}
