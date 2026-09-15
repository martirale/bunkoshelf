"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";

type DialogMode = "alert" | "confirm";

export interface AlertDialogOptions {
  eyebrow?: string;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  irreversible?: boolean;
}

type AlertDialogInput = string | AlertDialogOptions;

interface AlertDialogLabels {
  alertTitle: string;
  confirmTitle: string;
  confirmEyebrow: string;
  destructiveEyebrow: string;
  irreversibleDescription: string;
  confirm: string;
  cancel: string;
  close: string;
}

interface AlertDialogContextValue {
  alert: (input: AlertDialogInput) => Promise<void>;
  confirm: (input: AlertDialogInput) => Promise<boolean>;
}

interface DialogRequest extends AlertDialogOptions {
  mode: DialogMode;
  resolve: (confirmed: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

export function useAlertDialog() {
  return useContext(AlertDialogContext);
}

function toOptions(input: AlertDialogInput): AlertDialogOptions {
  return typeof input === "string" ? { description: input } : input;
}

export function AlertDialogProvider({
  children,
  labels,
}: {
  children: ReactNode;
  labels: AlertDialogLabels;
}) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [mounted, setMounted] = useState(false);
  const requestRef = useRef<DialogRequest | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => requestRef.current?.resolve(false);
  }, []);

  const open = (mode: DialogMode, input: AlertDialogInput) =>
    new Promise<boolean>((resolve) => {
      const nextRequest = { ...toOptions(input), mode, resolve };
      requestRef.current?.resolve(false);
      requestRef.current = nextRequest;
      setRequest(nextRequest);
    });

  const close = (confirmed: boolean) => {
    requestRef.current?.resolve(confirmed);
    requestRef.current = null;
    setRequest(null);
  };

  const value: AlertDialogContextValue = {
    alert: async (input) => {
      await open("alert", input);
    },
    confirm: (input) => open("confirm", input),
  };

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
      {mounted && request && createPortal(
        <AlertDialog request={request} labels={labels} onClose={close} />,
        document.body
      )}
    </AlertDialogContext.Provider>
  );
}

function AlertDialog({
  request,
  labels,
  onClose,
}: {
  request: DialogRequest;
  labels: AlertDialogLabels;
  onClose: (confirmed: boolean) => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const isConfirmation = request.mode === "confirm";
  const eyebrow = request.eyebrow || (
    request.irreversible
      ? labels.destructiveEyebrow
      : isConfirmation
        ? labels.confirmEyebrow
        : labels.alertTitle
  );

  useEffect(() => {
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onClick={() => onClose(false)}
    >
      <section
        role={isConfirmation ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="flex w-full max-w-[22rem] aspect-[4/5] max-h-[calc(100dvh-2rem)] flex-col rounded-xl border-2 border-onix bg-pearl p-6 text-onix shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-onix/60">
          {eyebrow}
        </p>
        <div className="flex flex-1 flex-col justify-center">
          <h2 id="alert-dialog-title" className="font-boldonse text-2xl leading-tight">
            {request.title || (isConfirmation ? labels.confirmTitle : labels.alertTitle)}
          </h2>
          <p id="alert-dialog-description" className="mt-5 leading-relaxed text-onix/80">
            {request.description}
          </p>
          {request.irreversible && (
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-danger-alt">
              {labels.irreversibleDescription}
            </p>
          )}
        </div>
        <div className="grid gap-3">
          {isConfirmation && (
            <Button
              type="button"
              onClick={() => onClose(false)}
              variant="light"
              className="w-full px-4 py-3 text-sm"
            >
              {request.cancelLabel || labels.cancel}
            </Button>
          )}
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={() => onClose(true)}
            variant={request.destructive ? "dark" : "dark"}
            className={request.destructive
              ? "w-full border-danger-alt bg-danger-alt px-4 py-3 text-sm text-pearl hover:border-black hover:bg-black hover:text-pearl"
              : "w-full px-4 py-3 text-sm"}
          >
            {isConfirmation ? request.confirmLabel || labels.confirm : labels.close}
          </Button>
        </div>
      </section>
    </div>
  );
}
