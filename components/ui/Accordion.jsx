"use client";

import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export default function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-700">
      <button
        className="w-full flex justify-between items-center py-3 text-left cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-boldonse">{title}</span>
        {isOpen ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}
