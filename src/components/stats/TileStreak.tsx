"use client";

type TileStreakProps = {
  title: string;
  dailyReadingDates: string[];
  daysLabel: string;
  bgColor: string;
  textColor: string;
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentReadingStreak(dailyReadingDates: string[]) {
  const readDaySet = new Set(dailyReadingDates);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  let streak = 0;

  while (readDaySet.has(formatLocalDate(currentDate))) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export default function TileStreak({
  title,
  dailyReadingDates,
  daysLabel,
  bgColor,
  textColor,
}: TileStreakProps) {
  const streak = getCurrentReadingStreak(dailyReadingDates);

  return (
    <div className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}>
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}>
        {streak} {daysLabel}
      </div>
    </div>
  );
}
