import { StarIcon } from "lucide-react";

export default function SeriesRating({ rating }) {
  if (rating === null || rating === undefined) return null;

  return (
    <div className="mt-8 flex items-center gap-1.5 text-4xl text-pearl">
      <StarIcon size={20} />
      <span className="tabular-nums font-bold">{Number(rating).toFixed(1)}</span>
    </div>
  );
}
