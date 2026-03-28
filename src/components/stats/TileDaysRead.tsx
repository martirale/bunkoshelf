type TileDaysReadProps = {
  title: string;
  daysReadCount: number;
  daysInMonth: number;
  bgColor: string;
  textColor: string;
};

export default function TileDaysRead({ title, daysReadCount, daysInMonth, bgColor, textColor }: TileDaysReadProps) {
  return (
    <div className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}>
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}>
        <p className="m-0">
          {daysReadCount}/<span className="text-sm">{daysInMonth}</span>
        </p>
      </div>
    </div>
  );
}
