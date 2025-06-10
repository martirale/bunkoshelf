"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function ReadingChallenge({ intl }) {
  const [goal, setGoal] = useState(12);
  const [progress] = useState(5);
  const percentage = Math.min((progress / goal) * 100, 100);

  const handleIncrement = () => setGoal((prev) => prev + 1);
  const handleDecrement = () => setGoal((prev) => Math.max(prev - 1, 1));

  return (
    <div className="w-full mx-auto rounded-lg bg-blackamber p-4 mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-2">
        <h2>{intl.profile.readingChallenge}</h2>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleDecrement}
            className="rounded-full border border-zinc-800 p-2 hover:border-lilah hover:bg-onix cursor-pointer transition-all duration-300"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="font-boldonse text-2xl mx-4">{goal}</span>

          <button
            onClick={handleIncrement}
            className="rounded-full border border-zinc-800 p-2 hover:border-lilah hover:bg-onix cursor-pointer transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 md:mt-4 space-y-1">
        <div className="flex justify-between text-sm uppercase">
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
