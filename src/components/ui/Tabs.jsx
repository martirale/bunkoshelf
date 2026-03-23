"use client";

import { useState } from "react";
import clsx from "clsx";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-8">
      <div className="flex gap-4 border-b border-neutral-700 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={clsx(
              "pb-2 text-sm uppercase cursor-pointer transition-colors duration-300",
              active === index
                ? "text-lilah border-b-2 border-lilah"
                : "text-neutral-500 hover:text-sand",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
