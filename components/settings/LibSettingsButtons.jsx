"use client";

import { useState } from "react";
import {
  FolderUpIcon,
  ScanSearchIcon,
  DatabaseBackupIcon,
  Loader2Icon,
  ServerIcon,
  CloudCheckIcon,
  ImageIcon,
  FileTextIcon,
  FolderSyncIcon,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import useScanPolling from "@/hooks/useScanPolling";
import Modal from "@/components/ui/Modal";
import UploadMangaForm from "./UploadMangaForm";
import { reindexLibrary, regenerateCovers, reprocessMetadata } from "@/actions/admin-scan";

export default function LibSettingsButtons({ lang, intl, libProvider }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
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
          title: intl.toastScan.errorTt,
          description: intl.toastScan.errorDesc,
          variant: "error",
        });
      }
    }
  };

  const handleReindex = async () => {
    let _err;
    try {
      setLoadingAction("reindex");
      addToast({
        id: "reindex-task",
        title: intl.toastScan.reindexTt,
        description: intl.toastScan.reindexDesc,
        variant: "default",
      });

      const data = await reindexLibrary({ forceAll: true });

      if (data.error) throw new Error(data.error);

      updateToast("reindex-task", {
        title: intl.toastScan.successReindexTt,
        description: `${data.seriesCount} ${intl.toastScan.successReindexDesc.prefix} ${data.volumeCount} ${intl.toastScan.successReindexDesc.suffix}`,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast("reindex-task", {
          title: intl.toastScan.errorTt,
          description: intl.toastScan.errorReindexDesc,
          variant: "error",
        });
      }
    }
  };

  const handleRegenerateCovers = async () => {
    let _err;
    try {
      setLoadingAction("covers");
      addToast({
        id: "covers-task",
        title: intl.toastScan.regeneratingCoversTt,
        description: intl.toastScan.regeneratingCoversDesc,
        variant: "default",
      });

      const data = await regenerateCovers({ forceAll: true });

      if (data.error) throw new Error(data.error);

      updateToast("covers-task", {
        title: intl.toastScan.successRegeneratingCoversTt,
        description: `${data.volumesUpdated} ${intl.toastScan.successRegeneratingCoversDesc}`,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast("covers-task", {
          title: intl.toastScan.errorTt,
          description: intl.toastScan.errorRegeneratingCoversDesc,
          variant: "error",
        });
      }
    }
  };

  const handleReprocessMetadata = async () => {
    let _err;
    try {
      setLoadingAction("metadata");
      addToast({
        id: "metadata-task",
        title: intl.toastScan.reprocessingMetaTt,
        description: intl.toastScan.reprocessingMetaDesc,
        variant: "default",
      });

      const data = await reprocessMetadata({ forceAll: true });

      if (data.error)
        throw new Error(data.error);

      updateToast("metadata-task", {
        title: intl.toastScan.successReprocessingMetaTt,
        description: data.message,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast("metadata-task", {
          title: intl.toastScan.errorTt,
          description: intl.toastScan.errorReprocessingMetaDesc,
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
        alert("Ocurrió un error al descargar la base de datos.");
      }
    }
  };

  const providerLabel =
    libProvider === "cloud"
      ? intl.settings.storageCloud
      : intl.settings.storageLocal;
  const ProviderIcon = libProvider === "cloud" ? CloudCheckIcon : ServerIcon;

  const isLoading = loading || loadingAction !== null;

  const ACTIONS = [
    {
      key: "provider",
      label: providerLabel,
      icon: ProviderIcon,
    },
    {
      key: "backup",
      label: intl.settings.backupdb,
      icon: DatabaseBackupIcon,
      onClick: handleDownload,
      disabled: isLoading,
    },
    {
      key: "upload",
      label: intl.settings.uploadLibrary,
      icon: FolderUpIcon,
      onClick: handleUploadMangas,
      disabled: isLoading,
    },
    {
      key: "scan",
      label: loading ? intl.settings.scanning : intl.settings.scanLibrary,
      icon: loading ? Loader2Icon : ScanSearchIcon,
      onClick: handleFullScan,
      disabled: isLoading,
      spinning: loading,
    },
    {
      key: "reindex",
      label:
        loadingAction === "reindex"
          ? intl.settings.reindexing
          : intl.settings.reindex,
      icon: loadingAction === "reindex" ? Loader2Icon : FolderSyncIcon,
      onClick: handleReindex,
      disabled: isLoading,
      spinning: loadingAction === "reindex",
    },
    {
      key: "covers",
      label:
        loadingAction === "covers"
          ? intl.settings.regeneratingCovers
          : intl.settings.regenerateCovers,
      icon: loadingAction === "covers" ? Loader2Icon : ImageIcon,
      onClick: handleRegenerateCovers,
      disabled: isLoading,
      spinning: loadingAction === "covers",
    },
    {
      key: "metadata",
      label:
        loadingAction === "metadata"
          ? intl.settings.reprocessingMeta
          : intl.settings.reprocessMetadata,
      icon: loadingAction === "metadata" ? Loader2Icon : FileTextIcon,
      onClick: handleReprocessMetadata,
      disabled: isLoading,
      spinning: loadingAction === "metadata",
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
