"use client";

import { useEffect, useState } from "react";
import { getReaderStats } from "@/actions/stats";

type TileAllReadProps = {
  title: string;
  bgColor: string;
  textColor: string;
};

export default function TileAllRead({ title, bgColor, textColor }: TileAllReadProps) {
  const [count, setCount] = useState<number | string | null>(null);
  const [totalVolumes, setTotalVolumes] = useState<number | string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();

        setCount(data?.allCompleted?.length ?? "—");
        setTotalVolumes(data?.totalVolumes ?? "—");
      } catch {
        setCount("—");
        setTotalVolumes("—");
      }
    }

    fetchData();
  }, []);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        <p>
          {count ?? "—"}/<span className="text-sm">{totalVolumes}</span>
        </p>
      </div>
    </div>
  );
}
