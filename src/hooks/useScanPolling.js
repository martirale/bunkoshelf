"use client";

import { useState, useEffect, useRef } from "react";
import { startScan, getScanStatus } from "@/actions/admin-scan";
import { sendPushBroadcast } from "@/actions/admin-push";

export default function useScanPolling({ lang, intl, addToast, updateToast }) {
  const pollingRef = useRef(null);
  const toastIdRef = useRef(null);
  const [scanStatus, setScanStatus] = useState(null);
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
    let startError = null;
    try {
      const result = await startScan();
      if (result.error) throw new Error(result.error);

      pollingRef.current = setInterval(async () => {
        let err = null;
        try {
          const data = await getScanStatus();
          if (data.error) throw new Error(data.error);

          setScanStatus(data);

          const taskText = data.currentTask || intl.toastScan.noTask;
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

          if (data.status === "done") {
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
          err = e;
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
      startError = e;
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
