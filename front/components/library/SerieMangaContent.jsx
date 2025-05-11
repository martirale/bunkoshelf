"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
          (item) => item.title.toLowerCase().replace(/\s+/g, "-") === series
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!serieData) {
    return <div>No data found for this series.</div>;
  }

  return (
    <div>
      <h1>{serieData.title}</h1>
      {/* Aquí puedes expandir con volúmenes, descripción, etc. */}
    </div>
  );
}
