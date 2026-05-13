import { connection } from "next/server";
import type { DictionarySection } from "@/lib/types";
import Challenge2025 from "./Challenge2025";
import Challenge2026 from "./Challenge2026";
import { query } from "@/lib/db/query";
import type { ReadingChallengeRecord } from "@/lib/types";

interface ChallengesProps {
  intl: DictionarySection;
}

export default async function Challenges({ intl }: ChallengesProps) {
  await connection();
  const challengeRows = await query<{
    id: string;
    user_id: string;
    year: number;
    goal: number;
    completed: number;
    notified: boolean;
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT id, user_id, year, goal, completed, notified, created_at, updated_at
      FROM reading_challenges
    `
  );
  const challenge: ReadingChallengeRecord[] = challengeRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    year: row.year,
    goal: row.goal,
    completed: row.completed,
    notified: row.notified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
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
