/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyIcon, XMarkIcon } from './icons';

interface ApiKeyDialogProps {
  onContinue: () => void;
  onClose: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 text-center flex flex-col items-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="bg-indigo-500/10 p-5 rounded-full mb-8 border border-indigo-500/20">
          <KeyIcon className="w-14 h-14 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-[var(--fg)] mb-4 italic">
          Paid API Key Required
        </h2>
        <p className="text-[var(--muted)] mb-8 leading-relaxed text-sm font-medium uppercase tracking-wider">
          Veo is a premium video generation model. To proceed, please select an API key from a billing-enabled Google Cloud project.
        </p>
        <div className="flex flex-col gap-3 w-full mb-10">
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] hover:text-indigo-400 transition-colors font-black border border-[var(--card-border)] py-3 rounded-xl hover:bg-[var(--card-bg)]"
          >
            How to enable billing
          </a>
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] hover:text-indigo-400 transition-colors font-black border border-[var(--card-border)] py-3 rounded-xl hover:bg-[var(--card-bg)]"
          >
            Veo pricing details
          </a>
        </div>
        <button
          onClick={onContinue}
          className="w-full px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all active:scale-95 shadow-2xl shadow-indigo-500/20"
        >
          Initialize Key Selection
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
