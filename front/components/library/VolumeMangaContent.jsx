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

        const manga = data.find(
          (item) => item.title.toLowerCase().replace(/\s+/g, "-") === slug
        );

        if (manga) {
          setVolumeData(manga);
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
      <h1>{volumeData.title}</h1>
    </div>
  );
}
