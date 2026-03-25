import { useState, type Dispatch, type SetStateAction } from "react";

let setOpenGlobal: Dispatch<SetStateAction<boolean>> | null = null;

interface SearchModalState {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function useSearchModal(): SearchModalState {
  const [open, setOpen] = useState(false);
  setOpenGlobal = setOpen;
  return { open, setOpen };
}

export function openSearchModal(): void {
  if (setOpenGlobal) setOpenGlobal(true);
}
