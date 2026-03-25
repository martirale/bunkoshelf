"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { startScan, getScanStatus } from "@/actions/admin-scan";
import { sendPushBroadcast } from "@/actions/web-push";
import type { ScanStatus } from "@/lib/types";

interface ToastOptions {
  title: string;
  description: string | ReactNode;
  variant: "default" | "success" | "error";
  duration?: number;
  manual?: boolean;
  open?: boolean;
}

interface ScanPollingIntl {
  toastScan: {
    noTask: string;
    progressTt: string;
    successTt: string;
    successDesc: string;
    errorTt: string;
    errorDesc: string;
  };
  push: {
    ttLibraryUpdate: string;
    bodyLibraryUpdate: string;
  };
}

interface UseScanPollingProps {
  lang: string;
  intl: ScanPollingIntl;
  addToast: (toast: ToastOptions) => number;
  updateToast: (id: number, data: Partial<ToastOptions>) => void;
}

interface UseScanPollingReturn {
  startPolling: () => Promise<void>;
  stopPolling: () => void;
  loading: boolean;
  scanStatus: ScanStatus | null;
}

export default function useScanPolling({
  lang,
  intl,
  addToast,
  updateToast,
}: UseScanPollingProps): UseScanPollingReturn {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastIdRef = useRef<number | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = async () => {
    setLoading(true);
    setScanStatus(null);
    let startError: Error | null = null;
    try {
      const result = await startScan();
      if (result?.error) throw new Error(result.error);

      pollingRef.current = setInterval(async () => {
        let err: Error | null = null;
        try {
          const data = await getScanStatus();
          if (data?.error) throw new Error(data.error);

          const status = data as ScanStatus;
          setScanStatus(status);

          const taskText = status.currentTask || intl.toastScan.noTask;
          const toastContent = <p>{taskText}</p>;

          if (toastIdRef.current) {
            updateToast(toastIdRef.current, {
              title: intl.toastScan.progressTt,
              description: toastContent,
              variant: "default",
              manual: true,
              open: true,
            });
          } else {
            toastIdRef.current = addToast({
              title: intl.toastScan.progressTt,
              description: toastContent,
              variant: "default",
              manual: true,
              open: true,
            });
          }

          if (status.status === "done") {
            stopPolling();
            setLoading(false);

            try {
              await sendPushBroadcast({
                title: intl.push.ttLibraryUpdate,
                body: intl.push.bodyLibraryUpdate,
                url: `/${lang}/manga`,
              });
            } catch (e) {
              console.error("Error al enviar notificaciones push:", e);
            }

            setTimeout(() => {
              if (toastIdRef.current) {
                updateToast(toastIdRef.current, { open: false });
                toastIdRef.current = null;
              }

              addToast({
                title: intl.toastScan.successTt,
                description: intl.toastScan.successDesc,
                variant: "success",
                duration: 3000,
              });

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }, 300);
          }
        } catch (e) {
          err = e as Error;
        } finally {
          if (err) {
            console.error("Error en polling de escaneo:", err);
            stopPolling();
            setLoading(false);
            if (toastIdRef.current) {
              updateToast(toastIdRef.current, { open: false });
              toastIdRef.current = null;
            }
            addToast({
              title: intl.toastScan.errorTt,
              description: intl.toastScan.errorDesc,
              variant: "error",
              duration: 3000,
            });
          }
        }
      }, 3000);
    } catch (e) {
      startError = e as Error;
    } finally {
      if (startError) {
        setLoading(false);
        throw startError;
      }
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return {
    startPolling,
    stopPolling,
    loading,
    scanStatus,
  };
}
