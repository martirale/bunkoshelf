import MiniSearch from "minisearch";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([], { status: 200 });
  }

  const volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
      metadataObj: true,
    },
  });

  const docs = volumes.map((vol) => ({
    id: vol.id,
    title: vol.metadataObj?.title || "",
    writer: vol.metadataObj?.writer || "",
    series: vol.series?.title || "",
    slug: vol.slug,
  }));

  // Creamos un "mapa" local para consultar después el documento completo por id
  const docsMap = new Map(docs.map((doc) => [doc.id, doc]));

  const miniSearch = new MiniSearch({
    fields: ["title", "writer", "series", "slug"],
    storeFields: ["id"],
  });

  miniSearch.addAll(docs);

  const results = miniSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  // Recuperamos los documentos completos usando docsMap
  const enrichedResults = results.map((res) => {
    const doc = docsMap.get(res.id);
    return {
      id: doc.id,
      title: doc.title,
      writer: doc.writer,
      series: doc.series,
      slug: doc.slug,
      score: res.score,
      match: res.match,
    };
  });

  return NextResponse.json(enrichedResults);
}
