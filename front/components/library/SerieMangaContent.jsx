"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/ui/Loader";

export default function SerieMangaContent() {
  const { series } = useParams();
  const router = useRouter();
  const [serieData, setSerieData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!series) return;

    const fetchSerieData = async () => {
      try {
        const res = await fetch("/api/library/manga");
        const data = await res.json();

        const serie = data.find(
          (item) => item.slug === series && item.type === "series"
        );

        if (serie) {
          if (serie.isOneshot && serie.volumes.length > 0) {
            const firstVolumeSlug = serie.volumes[0].slug;
            router.replace(`/manga/volume/${firstVolumeSlug}`);
            return;
          }

          setSerieData(serie);
        } else {
          console.error("Serie not found");
          setSerieData(null);
        }
      } catch (error) {
        console.error("Failed to fetch serie data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSerieData();
  }, [series, router]);

  if (loading) return <Loader />;
  if (!serieData) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{serieData.title}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {serieData.volumes.map((volume, idx) => (
          <Link
            key={idx}
            href={`/manga/volume/${volume.slug}`}
            className="border rounded p-2 hover:shadow transition"
          >
            <div className="text-sm font-medium">{volume.filename}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
