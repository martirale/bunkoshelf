import Link from "next/link";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export default async function ChallengeProg({ lang, intl }) {
  const user = await verifySession();
  if (!user) return null;

  const currentYear = new Date().getFullYear();

  const [challenge, userVolumes] = await Promise.all([
    prisma.readingChallenge.findFirst({
      where: {
        userId: user.id,
        year: currentYear,
      },
    }),
    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: {
        isRead: true,
        lastReadAt: true,
      },
    }),
  ]);

  const goal = challenge?.goal ?? 0;

  const progress =
    userVolumes?.filter((vol) => {
      if (!vol.lastReadAt) return false;
      const lastReadDate = new Date(vol.lastReadAt);
      return lastReadDate.getFullYear() === currentYear;
    }).length ?? 0;

  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  return (
    <Link href={`/${lang}/profile`} className="group">
      <div className="w-full px-2 mb-8">
        <div className="space-y-1">
          <div className="text-neutral-400 md:text-neutral-500 flex justify-between text-sm uppercase">
            <span>{intl.profile.ttChallenge}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-sand md:bg-onix rounded-full h-2 group-hover:bg-neutral-500 group-hover:md:bg-neutral-700 transition-all duration-300">
            <div
              className="bg-neutral-500 h-2 rounded-full group-hover:bg-lilah transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
