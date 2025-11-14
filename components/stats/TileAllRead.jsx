"use client";

import { useEffect, useState } from "react";

export default function TileAllRead({ title, bgColor, textColor }) {
  const [count, setCount] = useState(null);
  const [totalVolumes, setTotalVolumes] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();

        setCount(data?.allCompleted?.length ?? "—");
        setTotalVolumes(data?.totalVolumes ?? "—");
      } catch (err) {
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
