import type { DictionarySection, ReadingChallengeRecord } from "@/lib/types";
import Medal2025 from "./Medal2025";

interface Challenge2025Props {
  intl: DictionarySection;
  challenge: ReadingChallengeRecord[];
}

export default function Challenge2025({ intl, challenge }: Challenge2025Props) {
  const t = intl;
  const challenges = (t.profile as DictionarySection).challenges as DictionarySection;

  const items = Array.isArray(challenge)
    ? challenge.filter((item) => item.year === 2025)
    : [];
  const entry = items[0] ?? null;
  const completed = entry ? entry.completed >= (entry.goal ?? 0) : false;
  const progress = entry
    ? `${entry.completed ?? 0} ${challenges.of as string} ${entry.goal ?? 0}`
    : "0/0";

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg">
      <Medal2025 completed={completed} />
      <p className="text-center uppercase flex flex-col">
        <span className="text-sm font-bold">
          {challenges.challenge as string} 2025
        </span>
        <span className="text-xs">{progress}</span>
      </p>
    </div>
  );
}
