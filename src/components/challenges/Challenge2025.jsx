import Medal2025 from "./Medal2025";

export default function Challenge2025({ intl, challenge }) {
  const t = intl;

  const items = Array.isArray(challenge)
    ? challenge.filter((item) => item.year === 2025)
    : [];
  const entry = items[0] ?? null;
  const completed = entry ? entry.completed >= (entry.goal ?? 0) : false;
  const progress = entry
    ? `${entry.completed ?? 0} ${t.profile.challenges.of} ${entry.goal ?? 0}`
    : "0/0";

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg">
      <Medal2025 completed={completed} />
      <p className="text-center uppercase flex flex-col">
        <span className="text-sm font-bold">
          {t.profile.challenges.challenge} 2025
        </span>
        <span className="text-xs">{progress}</span>
      </p>
    </div>
  );
}
