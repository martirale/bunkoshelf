"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";

export default function ReadingChallenge({ intl, lang }) {
  const [goal, setGoal] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/profile/getChallenge?year=${currentYear}`
        );
        const data = await res.json();

        if (res.ok) {
          const userGoal = data.challenge?.goal ?? 0;
          const notified = data.challenge?.notified ?? false;
          notifiedRef.current = notified;

          setGoal(userGoal);

          const completedThisYear = data.userVolumes?.filter((vol) => {
            if (!vol.lastReadAt) return false;
            const lastReadDate = new Date(vol.lastReadAt);
            return (
              vol.isRead === true && lastReadDate.getFullYear() === currentYear
            );
          }).length;

          setProgress(completedThisYear ?? 0);

          if (
            completedThisYear >= userGoal &&
            userGoal > 0 &&
            !notified &&
            "serviceWorker" in navigator &&
            "PushManager" in window
          ) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const subscription =
                await registration.pushManager.getSubscription();

              if (subscription) {
                await fetch("https://push.amlab.site/send", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    subscription,
                    payload: {
                      title: intl.push.ttChallengeDone,
                      body: intl.push.bodyChallengeDone.replace(
                        "{year}",
                        currentYear
                      ),
                      url: `/${lang}/profile`,
                    },
                  }),
                });

                // Marcar como notificado en tu base de datos
                await fetch("/api/profile/updateChallenge", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ year: currentYear, notified: true }),
                });

                notifiedRef.current = true;
              }
            } catch (pushErr) {
              console.error("Error al enviar notificación push:", pushErr);
            }
          }
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
  }, [currentYear, intl, lang]);

  const updateGoal = async (newGoal) => {
    setGoal(newGoal);
    try {
      await fetch("/api/profile/updateChallenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: currentYear, goal: newGoal }),
      });
    } catch (error) {
      console.error("Failed to update goal:", error);
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
        <h2 className="text-base">{intl.profile.ttChallenge}</h2>

        <div className="flex items-center justify-center md:mt-1 2xl:mt-0 gap-2">
          <button
            onClick={handleDecrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="font-boldonse text-[42px] md:text-3xl mx-4 2xl:hidden leading-none">
            {goal}
          </span>

          <button
            onClick={handleIncrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <span className="font-boldonse text-5xl hidden 2xl:block">{goal}</span>

      <div className="mt-8 md:mt-4 space-y-1">
        <div className="text-neutral-500 flex justify-between text-sm uppercase">
          <span>
            {intl.profile.completed}: {progress}
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
