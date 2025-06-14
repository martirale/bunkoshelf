"use client";

import { useEffect, useState } from "react";

export default function TileStreak({ title, lang, intl, bgColor, textColor }) {
  const [streak, setStreak] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const dailyReading = data?.dailyReading || [];

        const readDaySet = new Set(dailyReading.map(({ date }) => date));

        const now = new Date();
        let currentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        let count = 0;

        while (true) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getDate()).padStart(2, "0");
          const dayKey = `${year}-${month}-${day}`;

          if (readDaySet.has(dayKey)) {
            count++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        setStreak(count.toString());

        // Notificación de racha
        const nowHour = now.getHours();
        const nowMinutes = now.getMinutes();

        const todayStr = now.toISOString().split("T")[0];
        const lastNotified = localStorage.getItem("lastStreakNotify");

        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(now.getDate() - 1);
        const yYear = yesterdayDate.getFullYear();
        const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, "0");
        const yDay = String(yesterdayDate.getDate()).padStart(2, "0");
        const yesterday = `${yYear}-${yMonth}-${yDay}`;

        const readYesterday = readDaySet.has(yesterday);
        const readToday = readDaySet.has(todayStr);

        const isAfter2030 =
          nowHour > 20 || (nowHour === 20 && nowMinutes >= 30);

        if (
          isAfter2030 &&
          readYesterday &&
          !readToday &&
          lastNotified !== todayStr
        ) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            await fetch("https://push.amlab.site/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscription,
                payload: {
                  title: intl.push.ttReadStreak,
                  body: intl.push.bodyReadStreak,
                  url: `/${lang}/manga`,
                },
              }),
            });

            localStorage.setItem("lastStreakNotify", todayStr);
          }
        }
      } catch (error) {
        console.error("Error al calcular la racha de lectura:", error);
        setStreak("—");
      }
    }

    fetchData();
  }, [intl, lang]);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {streak} {intl.home.days}
      </div>
    </div>
  );
}
