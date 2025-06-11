"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ChallengeProg({ lang, intl }) {
  const [goal, setGoal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/profile/getChallenge?year=${currentYear}`
        );
        const data = await res.json();

        if (res.ok) {
          const challengeGoal = data.challenge?.goal ?? 0;
          setGoal(challengeGoal);

          const completedThisYear =
            data.userVolumes?.filter((vol) => {
              if (!vol.lastReadAt) return false;
              const lastReadDate = new Date(vol.lastReadAt);
              return vol.isRead && lastReadDate.getFullYear() === currentYear;
            }).length ?? 0;

          setProgress(completedThisYear);
        } else {
          console.error("Error fetching challenge:", data.error);
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  if (loading) return null;

  return (
    <Link href={`/${lang}/profile`} className="group">
      <div className="w-full px-2 mb-8">
        <div className="space-y-1">
          <div className="text-neutral-400 md:text-neutral-500 flex justify-between text-sm uppercase">
            <span>{intl.profile.ttChallenge}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-sand md:bg-onix rounded-full h-2 group-hover:bg-neutral-500 group-hover:md:bg-neutral-700 transition-all duration-300">
            <div
              className="bg-neutral-500 h-2 rounded-full group-hover:bg-lilah transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
