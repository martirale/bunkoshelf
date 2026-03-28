"use client";

import { useState, useEffect, useRef } from "react";
import { PlusIcon, MinusIcon } from "lucide-react";
import { updateChallenge, getChallenge } from "@/actions/challenge";
import { sendPush } from "@/actions/web-push";
import type { DictionarySection } from "@/lib/types";

interface ReadingChallengeProps {
  intl: DictionarySection;
  lang: string;
}

export default function ReadingChallenge({ intl, lang }: ReadingChallengeProps) {
  const [goal, setGoal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef(false);

  const currentYear = new Date().getFullYear();

  const profile = intl.profile as DictionarySection;
  const push = intl.push as DictionarySection;

  useEffect(() => {
    const fetchData = async () => {
      let error: unknown = null;
      try {
        const data = await getChallenge({ year: currentYear });

        if (data.challenge) {
          const userGoal = data.challenge?.goal ?? 0;
          const completed = data.challenge?.completed ?? 0;
          const notified = data.challenge?.notified ?? false;

          notifiedRef.current = notified;
          setGoal(userGoal);
          setProgress(completed);

          if (completed >= userGoal && userGoal > 0 && !notified) {
            try {
              await sendPush({
                title: push.ttChallengeDone as string,
                body: (push.bodyChallengeDone as string).replace(
                  "{year}",
                  String(currentYear),
                ),
                url: `/${lang}/profile`,
              });

              await updateChallenge({ year: currentYear, notified: true });
              notifiedRef.current = true;
            } catch (pushErr) {
              console.error("Error al enviar notificación push:", pushErr);
            }
          }
        } else {
          console.error("Error fetching challenge:", data.error);
        }
      } catch (err) {
        error = err;
      } finally {
        if (error) {
          console.error("Fetch failed:", error);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear, push, lang]);

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    let error: unknown = null;
    try {
      await updateChallenge({ year: currentYear, goal: newGoal });
    } catch (err) {
      error = err;
    } finally {
      if (error) {
        console.error("Failed to update goal:", error);
      }
    }
  };

  const handleIncrement = () => updateGoal(goal + 1);
  const handleDecrement = () => {
    if (goal > 1) updateGoal(goal - 1);
  };

  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  return (
    <div className="flex flex-col justify-between w-full mx-auto rounded-lg bg-blackamber p-4 h-auto md:h-[128px] 2xl:h-auto">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-2">
        <h2 className="text-base">{profile.ttChallenge as string}</h2>

        <div className="flex items-center justify-center md:mt-1 2xl:mt-0 gap-2">
          <button
            onClick={handleDecrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <MinusIcon size={16} />
          </button>

          <span className="font-boldonse text-[42px] md:text-3xl mx-4 2xl:hidden leading-none">
            {goal}
          </span>

          <button
            onClick={handleIncrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <PlusIcon size={16} />
          </button>
        </div>
      </div>

      <span className="font-boldonse text-5xl hidden 2xl:block">{goal}</span>

      <div className="mt-8 md:mt-4 space-y-1">
        <div className="flex justify-between text-sm uppercase">
          <span>
            {profile.completed as string}: {progress}
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-sand rounded-full h-2">
          <div
            className="bg-lilah h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
