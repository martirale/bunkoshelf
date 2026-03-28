import { connection } from "next/server";
import type { DictionarySection } from "@/lib/types";
import Challenge2025 from "./Challenge2025";
import Challenge2026 from "./Challenge2026";
import prisma from "@/lib/prisma";

interface ChallengesProps {
  intl: DictionarySection;
}

export default async function Challenges({ intl }: ChallengesProps) {
  await connection();
  const challenge = await prisma.readingChallenge.findMany();
  const challenges = (intl.profile as DictionarySection).challenges as DictionarySection;

  return (
    <div className="bg-blackamber p-4 2xl:px-4 2xl:pt-4 rounded-lg">
      <h3 className="text-base mb-8">{challenges.title as string}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-4">
        <Challenge2026 intl={intl} challenge={challenge} />
        <Challenge2025 intl={intl} challenge={challenge} />
      </div>
    </div>
  );
}
