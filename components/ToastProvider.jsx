"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ToastItem from "./ui/ToastItem";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const timeouts = useRef({});

  useEffect(() => {
    setMounted(true);
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  };

  const addToast = (toast) => {
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

  const updateToast = (id, updatedData) => {
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
