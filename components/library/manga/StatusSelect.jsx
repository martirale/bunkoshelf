"use client";

import { useState, useRef, useEffect } from "react";
import {
  CircleFadingArrowUpIcon,
  CircleCheckBig,
  CirclePauseIcon,
  CircleXIcon,
} from "lucide-react";
import clsx from "clsx";

export default function StatusSelect({ lang, intl, seriesId, initStatus }) {
  const t = intl;

  const STATUS_OPTIONS = [
    {
      value: "ONGOING",
      label: t.manga.onGoing,
      icon: CircleFadingArrowUpIcon,
    },
    {
      value: "FINISHED",
      label: t.manga.finished,
      icon: CircleCheckBig,
    },
    {
      value: "HIATUS",
      label: t.manga.hiatus,
      icon: CirclePauseIcon,
    },
    {
      value: "CANCELLED",
      label: t.manga.cancelled,
      icon: CircleXIcon,
    },
  ];

  const [currentStatus, setCurrentStatus] = useState(initStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const selectRef = useRef(null);

  const currentOption = STATUS_OPTIONS.find(
    (opt) => opt.value === currentStatus
  );
  const CurrentIcon = currentOption?.icon || CircleFadingArrowUpIcon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      setCurrentStatus(newStatus);
    } catch (err) {
      console.error("Request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={selectRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl"
        )}
        title={currentOption?.label || "Seleccionar estado"}
      >
        <CurrentIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-blackamber rounded-lg shadow-lg overflow-hidden z-10 min-w-[180px]">
          {STATUS_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isLoading}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 transition-all duration-200",
                  currentStatus === option.value
                    ? "bg-sand text-onix"
                    : "text-sand hover:bg-pearl hover:text-onix"
                )}
              >
                <OptionIcon size={20} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
