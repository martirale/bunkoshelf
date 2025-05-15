"use client";

import { useState } from "react";
import { ScanSearch, Loader2 } from "lucide-react";
import { useToast } from "@/ui/toast/ToastProvider";

export default function LibSettingsButtons({ intl }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/indexManga", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al escanear la biblioteca");

      addToast({
        title: intl.toast.libScanSuccessTt,
        description: intl.toast.libScanSuccess,
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: intl.toast.libScanErrorTt,
        description: intl.toast.libScanError,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6">
      <button
        onClick={handleScan}
        disabled={loading}
        className="flex flex-col items-center justify-center text-base font-bold leading-5.5 uppercase bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-9 h-9 mb-4 animate-spin" />
        ) : (
          <ScanSearch className="w-9 h-9 mb-4" />
        )}
        {loading ? intl.settings.scanning : intl.settings.scanLibrary}
      </button>
    </div>
  );
}
