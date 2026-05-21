import { CheckIcon } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import type { CatalogRelationStats, PaginatedResult } from "@/lib/db/library";
import type { Dictionary } from "@/lib/types";

interface CatalogRelationsTableProps {
  data: PaginatedResult<CatalogRelationStats>;
  intl: Dictionary;
  nameLabel: string;
}

export default function CatalogRelationsTable({
  data,
  intl,
  nameLabel,
}: CatalogRelationsTableProps) {
  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-auto border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="font-bold uppercase bg-onix">
                <th className="p-4 text-left rounded-l-md">{nameLabel}</th>
                <th className="p-4 text-center">{intl.catalog.mangaColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.othersColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.booksColumn as string}</th>
                <th className="p-4 text-center rounded-r-md">{intl.catalog.totalColumn as string}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.name}>
                  <td className="p-4">
                    <div className="max-w-[18rem] whitespace-normal break-words leading-snug">
                      {item.name}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasManga ? <CheckIcon size={18} /> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasOthers ? <CheckIcon size={18} /> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasBooks ? <CheckIcon size={18} /> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.total > data.pageSize && (
        <div className="mt-8">
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            intl={intl}
          />
        </div>
      )}
    </>
  );
}
