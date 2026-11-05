import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-[#0f1d1b]',
    error: 'border-rose-500/30 bg-[#1d0f14]',
    info: 'border-indigo-500/30 bg-[#11162b]',
  };

  return (
    <div
      className={`pointer-events-auto border rounded-xl p-3.5 shadow-2xl flex items-start justify-between gap-3 text-xs animate-slide-up ${borders[toast.type]}`}
    >
      <div className="flex items-start gap-2.5">
        {icons[toast.type]}
        <div className="flex flex-col">
          <span className="font-semibold text-white tracking-tight">{toast.title}</span>
          {toast.message && <span className="text-slate-400 mt-0.5 leading-snug">{toast.message}</span>}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-0.5 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
