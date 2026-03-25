"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import ToastItem from "./ui/ToastItem";
import type { Toast, ToastInput, ToastContextValue } from "@/lib/types";

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const timeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setMounted(true);
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  };

  const addToast = (toast: ToastInput): number => {
    const id = Date.now() + toastIdCounter++;
    const duration = toast.manual ? null : toast.duration || 3500;

    setToasts((prev) => [...prev, { id, ...toast }]);

    if (duration) {
      timeouts.current[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const updateToast = (id: number, updatedData: Partial<ToastInput>) => {
    const duration = updatedData.manual ? null : updatedData.duration || 3500;

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
    );

    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }

    if (duration) {
      timeouts.current[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    if (updatedData.open === false) {
      removeToast(id);
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, updateToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 px-4 md:px-0 md:right-4 z-[100] space-y-2 w-full md:w-[320px] md:max-w-xs">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} {...toast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
