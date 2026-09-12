import { StarIcon } from "lucide-react";

interface BookSeriesRatingProps {
  rating: number | null;
}

export default function BookSeriesRating({ rating }: BookSeriesRatingProps) {
  if (rating === null || rating === undefined) return null;

  return (
    <div className="flex items-center gap-1.5 text-4xl text-pearl">
      <StarIcon size={20} />
      <span className="tabular-nums font-bold">{rating.toFixed(1)}</span>
    </div>
  );
}
