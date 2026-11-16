export interface LibrarySearchParams {
  page?: string;
  author?: string;
  genre?: string;
  tag?: string;
  publisher?: string | string[];
  includeOneshots?: string;
}

export function filterValues(value?: string | string[] | null): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((entry) => entry.trim()).filter(Boolean))];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  commaSeparated?: boolean;
}

export function readFilterSelection(params: URLSearchParams, groups: FilterGroup[]) {
  return Object.fromEntries(groups.map((group) => {
    const values = params.getAll(group.key);
    return [group.key, filterValues(group.commaSeparated ? values.flatMap((value) => value.split(",")) : values)];
  }));
}

export function updateFilterParams(params: URLSearchParams, groups: FilterGroup[], selection: Record<string, string[]>) {
  const next = new URLSearchParams(params);
  for (const group of groups) {
    next.delete(group.key);
    const values = selection[group.key] ?? [];
    if (group.commaSeparated && values.length) next.set(group.key, values.join(","));
    else values.forEach((value) => next.append(group.key, value));
  }
  next.set("page", "1");
  return next;
}
