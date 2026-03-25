import Link from "next/link";
import type { Dictionary, ChallengeData } from "@/lib/types";

interface ChallengeProgProps {
  lang: string;
  intl: Dictionary;
  data: ChallengeData | null;
}

export default function ChallengeProg({ lang, intl, data }: ChallengeProgProps) {
  if (!data) return null;

  return (
    <div className="w-full px-1 md:px-0 mb-4 md:mb-8">
      <Link href={`/${lang}/profile`} className="group">
        <div className="space-y-1">
          <div className="text-neutral-400 md:text-neutral-500 flex justify-between text-sm uppercase">
            <span>{intl.profile.ttChallenge as string}</span>
            <span>{Math.round(data.percentage)}%</span>
          </div>

          <div className="w-full bg-stone-300 md:bg-neutral-800 rounded-full h-2">
            <div
              className="bg-neutral-500 h-2 rounded-full group-hover:bg-lilah transition-all duration-300"
              style={{ width: `${data.percentage}%` }}
            ></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
