"use client";

export default function TileStreak({
  allReadDates,
  title,
  intl,
  bgColor,
  textColor,
}) {
  const readDaySet = new Set(
    allReadDates.map((d) => new Date(d).toLocaleDateString("sv-SE"))
  );

  let streak = 0;
  let current = new Date();

  while (true) {
    const currentStr = current.toLocaleDateString("sv-SE");
    if (readDaySet.has(currentStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {streak} {intl.home.days}
      </div>
    </div>
  );
}
