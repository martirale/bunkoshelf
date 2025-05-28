import React from "react";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

async function getAdminStats() {
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  const totalVolumes = await prisma.mangaVolume.count();

  const totalSeries = await prisma.mangaSeries.count({
    where: { isOneshot: false },
  });

  const volumesAddedThisMonth = await prisma.mangaVolume.count({
    where: {
      createdAt: {
        gte: startMonth,
        lte: endMonth,
      },
    },
  });

  const totalUsers = await prisma.user.count();

  return {
    totalVolumes,
    totalSeries,
    volumesAddedThisMonth,
    totalUsers,
  };
}

export default async function AdminStatsPanel() {
  const stats = await getAdminStats();

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Volúmenes totales" value={stats.totalVolumes} />
      <StatCard title="Series totales" value={stats.totalSeries} />
      <StatCard title="Añadidos este mes" value={stats.volumesAddedThisMonth} />
      <StatCard title="Usuarios existentes" value={stats.totalUsers} />
    </section>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg bg-blackamber p-4 mb-8 flex flex-col">
      <span className="text-sm uppercase">{title}</span>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
