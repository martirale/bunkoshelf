const comicTagGroups = [
  ["cómic", "comic"],
  ["novela gráfica", "graphic novel"],
  ["manhwa"],
  ["manhua"],
];

export function getComicTagAliases(tag: string): string[] | undefined {
  const normalized = tag.trim().toLowerCase();
  return comicTagGroups.find((aliases) => aliases.includes(normalized));
}
