"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getGenresStats } from "@/actions/stats";
import type { DictionarySection, GenreStatEntry } from "@/lib/types";

type TopGenresProps = {
  intl: DictionarySection;
  bgColor: string;
  textColor: string;
};

export default function TopGenres({
  intl,
  bgColor,
  textColor,
}: TopGenresProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<GenreStatEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);

    async function fetchGenres() {
      try {
        const result = await getGenresStats();
        if (result && "topGenres" in result && result.topGenres) {
          setData(result.topGenres as GenreStatEntry[]);
        }
      } catch (error) {
        console.error("Error fetching top genres:", error);
      }
    }

    fetchGenres();
  }, []);

  const stats = intl.stats as DictionarySection;

  return (
    <div
      className={`${bgColor} ${textColor} p-4 2xl:px-4 2xl:pt-4 rounded-lg flex flex-col justify-between`}
    >
      <h3 className="text-base mb-4">{stats.ttGenres as string}</h3>
      <div className="w-full h-72">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis
                dataKey="genre"
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <PolarRadiusAxis
                tick={{ fill: "currentColor", fontSize: 10 }}
                stroke="#444"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#151515",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
                labelStyle={{ color: "#e5e0dc" }}
                formatter={(value) => [
                  String(value ?? 0),
                  stats.tooltip as string,
                ]}
              />
              <Radar
                name="Lecturas"
                dataKey="user"
                fill="#8a6fdc"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}
