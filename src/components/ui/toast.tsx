"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", message, title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", message, title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", message, title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", message, title }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, removeToast, success, error, warning, info }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
            error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
            info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5",
                t.type === "success" && "border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20",
                t.type === "error" && "border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20",
                t.type === "warning" && "border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20",
                t.type === "info" && "border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20"
              )}
            >
              {icons[t.type]}
              <div className="flex-1 text-sm">
                {t.title && <h4 className="font-semibold text-foreground mb-0.5">{t.title}</h4>}
                <p className="text-muted-foreground">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

