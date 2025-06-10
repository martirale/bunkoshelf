"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

export default function ReadingChallenge({ intl }) {
  const [goal, setGoal] = useState(null);
  const [progress, setProgress] = useState(null);
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
          setGoal(data.challenge?.goal ?? 0);

          // Filtrar por el año actual
          const completedThisYear = data.userVolumes?.filter((vol) => {
            if (!vol.lastReadAt) return false;
            const lastReadDate = new Date(vol.lastReadAt);
            return (
              vol.isRead === true && lastReadDate.getFullYear() === currentYear
            );
          }).length;
          setProgress(completedThisYear ?? 0);

          setProgress(completedThisYear ?? 0);
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

  const handleIncrement = () => {
    const newGoal = goal + 1;
    updateGoal(newGoal);
  };

  const handleDecrement = () => {
    if (goal > 1) {
      const newGoal = goal - 1;
      updateGoal(newGoal);
    }
  };

  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  if (loading) return null;

  return (
    <div className="w-full mx-auto rounded-lg bg-blackamber p-4 mt-8 mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-2">
        <h2>{intl.profile.ttChallenge}</h2>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleDecrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="font-boldonse text-2xl mx-4">{goal}</span>

          <button
            onClick={handleIncrement}
            className="rounded-full border border-neutral-800 p-2 hover:border-lilah cursor-pointer transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

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
