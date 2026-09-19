"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import UploadMangaForm from "@/components/settings/UploadMangaForm";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogLibraryUploadProps {
  intl: Dictionary;
  lang: Locale;
}

export default function CatalogLibraryUpload({
  intl,
  lang,
}: CatalogLibraryUploadProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="light"
        size="small"
        onClick={() => setIsOpen(true)}
      >
        {intl.catalog.uploadLibrary as string}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <UploadMangaForm intl={intl} lang={lang} />
      </Modal>
    </>
  );
}
