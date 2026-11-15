import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const toasts = useFaeQuestStore((state) => state.toasts);
  const removeToast = useFaeQuestStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-opal-light shrink-0" />;
        let borderClass = 'border-opal/40';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-fae shrink-0" />;
          borderClass = 'border-fae/60';
        } else if (toast.type === 'error') {
          icon = <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/60';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-thorn-dark/95 backdrop-blur-md border ${borderClass} shadow-2xl text-xs sm:text-sm text-parchment animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="font-medium break-words">{toast.text}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-parchment/40 hover:text-parchment p-1 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
