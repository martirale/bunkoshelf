export function getProfileImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/api/profile/${encodeURIComponent(filename)}`;
}
