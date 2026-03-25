export type ToastVariant =
  | "success"
  | "warning"
  | "danger"
  | "error"
  | "default";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  manual?: boolean;
  open?: boolean;
}

export interface Toast extends ToastInput {
  id: number;
}

export interface ToastContextValue {
  addToast: (toast: ToastInput) => number;
  updateToast: (id: number, data: Partial<ToastInput>) => void;
}
