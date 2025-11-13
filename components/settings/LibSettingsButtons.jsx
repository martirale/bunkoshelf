"use client";

import { useState } from "react";
import {
  FolderUpIcon,
  ScanSearchIcon,
  DatabaseBackupIcon,
  Loader2Icon,
  ServerIcon,
  CloudCheckIcon,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import useScanPolling from "@/hooks/useScanPolling";
import Modal from "@/components/ui/Modal";
import UploadMangaForm from "./UploadMangaForm";

export default function LibSettingsButtons({ lang, intl, libProvider }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { addToast, updateToast } = useToast();
  const { startPolling, loading } = useScanPolling({
    lang,
    intl,
    addToast,
    updateToast,
  });

  const handleUploadMangas = () => {
    setUploadOpen(true);
  };

  const handleFullScan = async () => {
    let _err;
    try {
      await startPolling();
    } catch (e) {
      _err = e;
    } finally {
      if (_err) {
        addToast({
          title: intl.toastSettings.scanErrorTt,
          description: intl.toastSettings.scanError,
          variant: "error",
        });
      }
    }
  };

  const handleDownload = async () => {
    let url;
    let _err;
    try {
      const res = await fetch("/api/admin/db/download");
      if (!res.ok) throw new Error("No se pudo descargar la base de datos");
      const blob = await res.blob();
      url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bunkoshelf.db";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      _err = e;
    } finally {
      if (url) window.URL.revokeObjectURL(url);
      if (_err) {
        console.error(_err);
        alert(
          intl.toastSettings.backupErrorAlert ||
            "Ocurrió un error al descargar la base de datos."
        );
      }
    }
  };

  const providerLabel =
    libProvider === "cloud"
      ? intl.settings.storageCloud
      : intl.settings.storageLocal;
  const ProviderIcon = libProvider === "cloud" ? CloudCheckIcon : ServerIcon;

  const ACTIONS = [
    {
      key: "upload",
      label: intl.settings.uploadLibrary,
      icon: FolderUpIcon,
      onClick: handleUploadMangas,
      disabled: loading,
    },
    {
      key: "scan",
      label: loading ? intl.settings.scanning : intl.settings.scanLibrary,
      icon: loading ? Loader2Icon : ScanSearchIcon,
      onClick: handleFullScan,
      disabled: loading,
      spinning: loading,
    },
    {
      key: "backup",
      label: intl.settings.backupdb,
      icon: DatabaseBackupIcon,
      onClick: handleDownload,
      disabled: loading,
    },
    {
      key: "provider",
      label: providerLabel,
      icon: ProviderIcon,
    },
  ];

  function ActionButton({ action }) {
    const Icon = action.icon;
    return (
      <button
        onClick={action.onClick}
        disabled={action.disabled}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        <Icon
          size={36}
          className={`mb-4 ${action.spinning ? "animate-spin" : ""}`}
        />
        {action.label}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {ACTIONS.map((a) => (
        <ActionButton key={a.key} action={a} />
      ))}

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)}>
        <UploadMangaForm intl={intl} />
      </Modal>
    </div>
  );
}
