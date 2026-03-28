"use client";

import { useState } from "react";
import {
  FolderUpIcon,
  DatabaseBackupIcon,
  ServerIcon,
  CloudCheckIcon,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import useScanPolling from "@/hooks/useScanPolling";
import Modal from "@/components/ui/Modal";
import UploadMangaForm from "./UploadMangaForm";
import {
  reindexLibrary,
  regenerateCovers,
  reprocessMetadata,
} from "@/actions/admin-scan";
import type { Dictionary } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface LibSettingsButtonsProps {
  lang: string;
  intl: Dictionary;
  libProvider: string | undefined;
}

type LoadingActionType = "reindex" | "covers" | "metadata" | null;

interface ActionItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  spinning?: boolean;
}

export default function LibSettingsButtons({
  lang,
  intl,
  libProvider,
}: LibSettingsButtonsProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoadingActionType>(null);
  const { addToast, updateToast } = useToast()!;
  const { startPolling, loading } = useScanPolling({
    lang,
    intl: intl as unknown as Parameters<typeof useScanPolling>[0]["intl"],
    addToast,
    updateToast,
  });

  const handleUploadMangas = () => {
    setUploadOpen(true);
  };

  const handleFullScan = async () => {
    let _err: unknown;
    try {
      await startPolling();
    } catch (e) {
      _err = e;
    } finally {
      if (_err) {
        addToast({
          title: intl.toastScan.errorTt as string,
          description: intl.toastScan.errorDesc as string,
          variant: "error",
        });
      }
    }
  };

  const handleReindex = async () => {
    let _err: unknown;
    let toastId: number;
    try {
      setLoadingAction("reindex");
      toastId = addToast({
        title: intl.toastScan.reindexTt as string,
        description: intl.toastScan.reindexDesc as string,
        variant: "default",
        manual: true,
      });

      const data = await reindexLibrary({ forceAll: true });

      if (data?.error) throw new Error(data.error);

      updateToast(toastId, {
        title: intl.toastScan.successReindexTt as string,
        description: `${data?.seriesCount} ${(intl.toastScan.successReindexDesc as Record<string, string>).prefix} ${data?.volumeCount} ${(intl.toastScan.successReindexDesc as Record<string, string>).suffix}`,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast(toastId!, {
          title: intl.toastScan.errorTt as string,
          description: intl.toastScan.errorReindexDesc as string,
          variant: "error",
        });
      }
    }
  };

  const handleRegenerateCovers = async () => {
    let _err: unknown;
    let toastId: number;
    try {
      setLoadingAction("covers");
      toastId = addToast({
        title: intl.toastScan.regeneratingCoversTt as string,
        description: intl.toastScan.regeneratingCoversDesc as string,
        variant: "default",
        manual: true,
      });

      const data = await regenerateCovers({ forceAll: true });

      if (data?.error) throw new Error(data.error);

      updateToast(toastId, {
        title: intl.toastScan.successRegeneratingCoversTt as string,
        description: `${data?.volumesUpdated} ${intl.toastScan.successRegeneratingCoversDesc}`,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast(toastId!, {
          title: intl.toastScan.errorTt as string,
          description: intl.toastScan.errorRegeneratingCoversDesc as string,
          variant: "error",
        });
      }
    }
  };

  const handleReprocessMetadata = async () => {
    let _err: unknown;
    let toastId: number;
    try {
      setLoadingAction("metadata");
      toastId = addToast({
        title: intl.toastScan.reprocessingMetaTt as string,
        description: intl.toastScan.reprocessingMetaDesc as string,
        variant: "default",
        manual: true,
      });

      const data = await reprocessMetadata({ forceAll: true });

      if (data?.error) throw new Error(data.error);

      updateToast(toastId, {
        title: intl.toastScan.successReprocessingMetaTt as string,
        description: data?.message as string,
        variant: "success",
      });
    } catch (e) {
      _err = e;
    } finally {
      setLoadingAction(null);
      if (_err) {
        updateToast(toastId!, {
          title: intl.toastScan.errorTt as string,
          description: intl.toastScan.errorReprocessingMetaDesc as string,
          variant: "error",
        });
      }
    }
  };

  const handleDownload = async () => {
    let url: string | undefined;
    let _err: unknown;
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
      ? (intl.settings.storageCloud as string)
      : (intl.settings.storageLocal as string);
  const ProviderIcon = libProvider === "cloud" ? CloudCheckIcon : ServerIcon;

  const isLoading = loading || loadingAction !== null;

  const ACTIONS: ActionItem[] = [
    {
      key: "provider",
      label: providerLabel,
      icon: ProviderIcon,
    },
    {
      key: "backup",
      label: intl.settings.backupdb as string,
      icon: DatabaseBackupIcon,
      onClick: handleDownload,
      disabled: isLoading,
    },
    {
      key: "upload",
      label: intl.settings.uploadLibrary as string,
      icon: FolderUpIcon,
      onClick: handleUploadMangas,
      disabled: isLoading,
    },
  ];

  function ActionButton({ action }: { action: ActionItem }) {
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
