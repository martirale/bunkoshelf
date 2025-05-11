"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function VolumeMangaContent() {
  const { slug } = useParams();
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchVolumeData = async () => {
      try {
        const res = await fetch("/api/library/manga");
        const data = await res.json();

        let volumeEntry = null;

        // Caso 1: volumen individual
        const directVolume = data.find(
          (item) => item.type === "volume" && item.slug === slug
        );

        if (directVolume) {
          volumeEntry = directVolume;
        } else {
          // Caso 2: volumen dentro de una serie
          for (const item of data) {
            if (item.type === "series") {
              const foundVolume = item.volumes.find((v) => v.slug === slug);
              if (foundVolume) {
                volumeEntry = {
                  ...foundVolume,
                  seriesTitle: item.title,
                  type: "volume-in-series",
                };
                break;
              }
            }
          }
        }

        if (volumeEntry) {
          setVolumeData(volumeEntry);
        } else {
          console.error("Manga not found");
        }
      } catch (error) {
        console.error("Failed to fetch volume data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeData();
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!volumeData) {
    return <div>No data found for this volume.</div>;
  }

  return (
    <div>
      {volumeData.seriesTitle && (
        <p style={{ fontStyle: "italic" }}>Serie: {volumeData.seriesTitle}</p>
      )}
      <h1>{volumeData.title || volumeData.filename}</h1>
    </div>
  );
}
