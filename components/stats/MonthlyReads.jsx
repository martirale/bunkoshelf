"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { getReaderStats } from "@/actions/stats";

export default function MonthlyReads({ intl, bgColor, textColor }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchMonthlyReads() {
      const json = await getReaderStats();
      if (json.monthlyReads) {
        const localized = json.monthlyReads.map((entry) => ({
          name: intl.months[entry.month],
          count: entry.count,
        }));
        setData(localized);
      }
    }

    fetchMonthlyReads();
  }, [intl]);

  return (
    <div
      className={`${bgColor} ${textColor} p-4 2xl:px-4 2xl:pt-4 rounded-lg flex flex-col justify-between`}
    >
      <h3 className="text-base mb-4">{intl.stats.ttMonthlyRead}</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[400px] md:min-w-[500px] h-72 uppercase">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barCategoryGap="30%"
              barGap={2}
              margin={{ top: 0, right: 0, bottom: 0, left: -35 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#151515",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
                labelStyle={{ color: "#e5e0dc" }}
                formatter={(value) => [`${value}`, intl.stats.tooltip]}
              />
              <Bar
                dataKey="count"
                fill="#8a6fdc"
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: "#f7f2ec" }}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  fill="#737373"
                  fontSize={14}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
