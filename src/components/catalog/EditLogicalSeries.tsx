import { verifySession } from "@/lib/auth/verifySession";
import { findLogicalSeriesForEdit, listLogicalSeriesOptions } from "@/lib/db/logicalSeries";
import type { LogicalSeriesSection } from "@/lib/logicalSeries";
import type { Dictionary } from "@/lib/types";
import LogicalSeriesDialog from "./LogicalSeriesDialog";

export default async function EditLogicalSeries({ seriesId, section, intl }: { seriesId: string; section: LogicalSeriesSection; intl: Dictionary }) {
  const user = await verifySession();
  if (!user?.isAdmin) return null;
  const [series, options] = await Promise.all([
    findLogicalSeriesForEdit(seriesId, section),
    listLogicalSeriesOptions(seriesId),
  ]);
  if (!series) return null;
  return <LogicalSeriesDialog intl={intl} options={options} initialSeries={series} />;
}
