import Link from "next/link";

export default function ChallengeProg({ lang, intl, data }) {
  if (!data) return null;

  return (
    <Link href={`/${lang}/profile`} className="group">
      <div className="w-full px-2 mb-4 md:mb-8">
        <div className="space-y-1">
          <div className="text-neutral-400 md:text-neutral-500 flex justify-between text-sm uppercase">
            <span>{intl.profile.ttChallenge}</span>
            <span>{Math.round(data.percentage)}%</span>
          </div>
          <div className="w-full bg-sand md:bg-onix rounded-full h-2 group-hover:bg-neutral-500 group-hover:md:bg-neutral-700 transition-all duration-300">
            <div
              className="bg-neutral-500 h-2 rounded-full group-hover:bg-lilah transition-all duration-300"
              style={{ width: `${data.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
