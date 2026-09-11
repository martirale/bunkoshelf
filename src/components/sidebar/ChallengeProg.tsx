"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChallenge } from "@/actions/challenge";
import type { Dictionary, ChallengeData } from "@/lib/types";

interface ChallengeProgProps {
  lang: string;
  intl: Dictionary;
  data: ChallengeData | null;
}

export default function ChallengeProg({ lang, intl, data }: ChallengeProgProps) {
  const [challengeData, setChallengeData] = useState(data);

  useEffect(() => {
    setChallengeData(data);
  }, [data]);

  useEffect(() => {
    const refreshChallenge = async () => {
      const result = await getChallenge({ year: new Date().getFullYear() });
      const challenge = result.challenge;

      if (!challenge) return;

      const percentage = challenge.goal === 0
        ? 0
        : Math.min((challenge.completed / challenge.goal) * 100, 100);

      setChallengeData({
        goal: challenge.goal,
        progress: challenge.completed,
        percentage,
      });
    };

    window.addEventListener("bunko:challenge-updated", refreshChallenge);

    return () => {
      window.removeEventListener("bunko:challenge-updated", refreshChallenge);
    };
  }, []);

  if (!challengeData) return null;

  return (
    <div className="w-full px-1 md:px-0 mb-4 md:mb-8">
      <Link href={`/${lang}/profile`} className="group">
        <div className="space-y-1">
          <div className="text-neutral-400 md:text-neutral-500 flex justify-between text-sm uppercase">
            <span>{intl.profile.ttChallenge as string}</span>
            <span>{Math.round(challengeData.percentage)}%</span>
          </div>

          <div className="w-full bg-stone-300 md:bg-neutral-800 rounded-full h-2">
            <div
              className="bg-neutral-500 h-2 rounded-full group-hover:bg-lilah transition-all duration-300"
              style={{ width: `${challengeData.percentage}%` }}
            ></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
