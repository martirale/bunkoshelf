// hooks/useSearchModal.js
import { useState } from "react";

let setOpenGlobal;

export function useSearchModal() {
  const [open, setOpen] = useState(false);
  setOpenGlobal = setOpen;
  return { open, setOpen };
}

export function openSearchModal() {
  if (setOpenGlobal) setOpenGlobal(true);
}
