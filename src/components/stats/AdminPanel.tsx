import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Dictionary } from "@/lib/types";

interface AdminStats {
  totalVolumes: number;
  volumesAddedThisMonth: number;
  totalSeries: number;
  totalUsers: number;
}

async function getAdminStats(): Promise<AdminStats> {
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
    volumesAddedThisMonth,
    totalSeries,
    totalUsers,
  };
}

interface AdminStatsPanelProps {
  intl: Dictionary;
}

export default async function AdminStatsPanel({ intl }: AdminStatsPanelProps) {
  const stats = await getAdminStats();

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title={intl.settings.totalVolumes as string} value={stats.totalVolumes} />
      <StatCard
        title={intl.settings.totalAddedMonth as string}
        value={stats.volumesAddedThisMonth}
      />
      <StatCard title={intl.settings.totalSeries as string} value={stats.totalSeries} />
      <StatCard title={intl.settings.totalUsers as string} value={stats.totalUsers} />
    </section>
  );
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="h-[110px] rounded-lg bg-blackamber p-4 2xl:px-4 2xl:pb-5 flex flex-col justify-between">
      <span className="text-sm uppercase">{title}</span>
      <div className="font-boldonse 2xl:text-2xl leading-7.5 mt-2 flex items-center">
        {value}
      </div>
    </div>
  );
}
