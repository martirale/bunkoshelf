"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ToastItem from "./ToastItem";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = (toast) => {
    const id = Date.now() + toastIdCounter++;
    const duration = toast.duration || 5000;

    setToasts((prev) => [...prev, { id, ...toast }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  };

  const updateToast = (id, updatedData) => {
    const duration = updatedData.duration || 3500;

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
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
