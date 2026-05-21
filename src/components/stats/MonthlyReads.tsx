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
import type { DictionarySection } from "@/lib/types";

type MonthlyReadsProps = {
  intl: DictionarySection;
  bgColor: string;
  textColor: string;
};

type ChartEntry = {
  name: string;
  count: number;
};

export default function MonthlyReads({
  intl,
  bgColor,
  textColor,
}: MonthlyReadsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<ChartEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);

    async function fetchMonthlyReads() {
      const json = await getReaderStats();
      if ("monthlyReads" in json && json.monthlyReads) {
        const months = intl.months as Record<string, string>;
        const localized = json.monthlyReads.map((entry) => ({
          name: months[entry.month],
          count: entry.count,
        }));
        setData(localized);
      }
    }

    fetchMonthlyReads();
  }, [intl]);

  const stats = intl.stats as DictionarySection;

  return (
    <div
      className={`${bgColor} ${textColor} p-4 2xl:px-4 2xl:pt-4 rounded-lg flex flex-col justify-between`}
    >
      <h3 className="text-base mb-4">{stats.ttMonthlyRead as string}</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[400px] md:min-w-[500px] h-72 uppercase">
          {isMounted ? (
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
                  formatter={(value) => [
                    String(value ?? 0),
                    stats.tooltip as string,
                  ]}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
