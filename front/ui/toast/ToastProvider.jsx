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
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] space-y-2">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} {...toast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
