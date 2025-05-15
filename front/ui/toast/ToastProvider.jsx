"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ToastItem from "./ToastItem";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = (toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} {...toast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
