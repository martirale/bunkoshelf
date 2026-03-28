import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

type Trend = "up" | "down" | "flat" | null;

type TileMonthTrendProps = {
  title: string;
  percentageChange: number | string;
  trend: Trend;
  bgColor: string;
  textColor: string;
};

export default function TileMonthTrend({ title, percentageChange, trend, bgColor, textColor }: TileMonthTrendProps) {
  const color =
    trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-400";

  const IconComponent =
    trend === "up" ? ArrowUpIcon : trend === "down" ? ArrowDownIcon : MinusIcon;

  return (
    <div className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}>
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}>
        <span>{percentageChange}%</span>
        <IconComponent size={24} className={`ml-2 ${color}`} />
      </div>
    </div>
  );
}
