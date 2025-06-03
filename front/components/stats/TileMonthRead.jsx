"use client";

import { useState, useEffect } from "react";

export default function TileMonthRead({
  title,
  totalRead,
  year,
  month,
  bgColor,
  textColor,
}) {
  const [displayRead, setDisplayRead] = useState(totalRead);

  useEffect(() => {
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth() + 1;

    if (localYear > year || (localYear === year && localMonth > month)) {
      setDisplayRead(0);
    } else {
      setDisplayRead(totalRead);
    }
  }, [totalRead, year, month]);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {displayRead}
      </div>
    </div>
  );
}
