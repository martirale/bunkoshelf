"use client";

export default function TileMonthRead({
  title,
  allReadDates,
  bgColor,
  textColor,
}) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = String(now.getMonth() + 1).padStart(2, "0");

  const totalRead = Array.isArray(allReadDates)
    ? allReadDates.filter((dateStr) => {
        const [year, month] = dateStr.split("-");
        return year == thisYear && month === thisMonth;
      }).length
    : 0;

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {totalRead}
      </div>
    </div>
  );
}
