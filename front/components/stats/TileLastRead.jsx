"use client";

export default function TileLastRead({
  date,
  title,
  lang,
  bgColor,
  textColor,
}) {
  let displayValue = "-";

  if (date) {
    const value = new Date(date);
    const options = {
      day: "numeric",
      month: "short",
      ...(value.getFullYear() !== new Date().getFullYear()
        ? { year: "numeric" }
        : {}),
    };

    displayValue = value.toLocaleDateString(lang, options);
  }

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {displayValue}
      </div>
    </div>
  );
}
