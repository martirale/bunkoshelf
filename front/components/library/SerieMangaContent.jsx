"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SerieMangaContent() {
  const { series } = useParams();
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
          setSerieData(serie);
        } else {
          console.error("Serie not found");
        }
      } catch (error) {
        console.error("Failed to fetch serie data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSerieData();
  }, [series]);

  if (loading) return <div>Loading...</div>;
  if (!serieData) return <div>No data found for this series.</div>;

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
