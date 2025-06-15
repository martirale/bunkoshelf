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

export default function TopGenres({ intl, bgColor, textColor }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await fetch("/api/stats/genres");
        const json = await res.json();
        if (json.topGenres) {
          setData(json.topGenres);
        }
      } catch (error) {
        console.error("Error fetching top genres:", error);
      }
    }

    fetchGenres();
  }, []);

  return (
    <div
      className={`${bgColor} ${textColor} p-4 2xl:px-4 2xl:pt-4 rounded-lg flex flex-col justify-between`}
    >
      <h3 className="text-base mb-4">Top (géneros)</h3>
      <div className="w-full h-72">
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
              formatter={(value) => [`${value}`, intl.stats.tooltip]}
            />
            <Radar
              name="Lecturas"
              dataKey="user"
              fill="#8a6fdc"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
