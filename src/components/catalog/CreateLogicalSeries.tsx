import LogicalSeriesDialog from "./LogicalSeriesDialog";
import type { LogicalSeriesOption } from "@/lib/logicalSeries";
import type { Dictionary } from "@/lib/types";

export default function CreateLogicalSeries({ intl, options }: { intl: Dictionary; options: LogicalSeriesOption[] }) {
  return <LogicalSeriesDialog intl={intl} options={options} />;
}
