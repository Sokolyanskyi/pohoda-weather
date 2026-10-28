"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  tone?: "ok" | "error";
  onDone: () => void;
}

export function Toast({ message, tone = "ok", onDone }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <span className="toast-dot" />
      {message}
    </div>
  );
}
