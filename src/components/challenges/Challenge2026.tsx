import type { ReadingChallenge } from "@prisma/client";
import type { DictionarySection } from "@/lib/types";
import Medal2026 from "./Medal2026";

interface Challenge2026Props {
  intl: DictionarySection;
  challenge: ReadingChallenge[];
}

export default function Challenge2026({ intl, challenge }: Challenge2026Props) {
  const t = intl;
  const challenges = (t.profile as DictionarySection).challenges as DictionarySection;

  const items = Array.isArray(challenge)
    ? challenge.filter((item) => item.year === 2026)
    : [];
  const entry = items[0] ?? null;
  const completed = entry ? entry.completed >= (entry.goal ?? 0) : false;
  const progress = entry
    ? `${entry.completed ?? 0} ${challenges.of as string} ${entry.goal ?? 0}`
    : "0/0";

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg">
      <Medal2026 completed={completed} />
      <p className="text-center uppercase flex flex-col">
        <span className="text-sm font-bold">
          {challenges.challenge as string} 2026
        </span>
        <span className="text-xs">{progress}</span>
      </p>
    </div>
  );
}
