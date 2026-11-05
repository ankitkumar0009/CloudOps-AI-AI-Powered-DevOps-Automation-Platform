import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  commandPreview?: string;
  confirmWord?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  commandPreview,
  confirmWord,
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const [inputWord, setInputWord] = useState('');

  if (!isOpen) return null;

  const canConfirm = !confirmWord || inputWord === confirmWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl max-w-md w-full shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">{description}</p>

        {commandPreview && (
          <div className="mb-4">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Target Command:</span>
            <pre className="p-2.5 rounded-lg bg-[#050811] border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
              {commandPreview}
            </pre>
          </div>
        )}

        {confirmWord && (
          <div className="mb-5">
            <label className="text-xs text-slate-300 block mb-1.5">
              Type <span className="font-mono font-bold text-rose-400">{confirmWord}</span> to confirm:
            </label>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder={confirmWord}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => {
              setInputWord('');
              onConfirm();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            Confirm & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
