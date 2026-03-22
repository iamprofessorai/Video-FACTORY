import React from 'react';
import {HistoryItem} from '../types';
import {Play, Trash2, X, Zap} from 'lucide-react';
import {ClockIcon} from './icons';

interface HistoryProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

const History: React.FC<HistoryProps> = ({items, onSelect, onDelete, onClear, onClose}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--card-border)]">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Production Log
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center flex-grow p-8 sm:p-12 text-[var(--muted)]">
          <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-40" />
          <p className="text-xs sm:text-sm uppercase tracking-widest font-bold">No production history yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Production Log
          </h3>
          <button
            onClick={onClear}
            className="text-[9px] sm:text-[10px] uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors">
            Clear All
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 sm:p-4 hover:bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all cursor-pointer flex gap-4"
            onClick={() => onSelect(item)}>
            
            {/* Video Preview Thumbnail */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-black rounded-lg overflow-hidden border border-[var(--card-border)] group-hover:border-[var(--accent)]/50 transition-colors">
              {item.videoUrl ? (
                <video
                  src={item.videoUrl}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  muted
                  loop
                  playsInline
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Play className="w-6 h-6 text-[var(--muted)] opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <span className="text-[8px] font-bold uppercase tracking-widest text-white">Preview</span>
              </div>
            </div>

            <div className="flex-grow flex flex-col min-w-0">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] sm:text-[10px] text-[var(--muted)] font-mono">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[var(--fg)] line-clamp-2 mb-2 font-light italic">
                "{item.params.prompt || 'No prompt provided'}"
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[8px] sm:text-[9px] px-2 py-0.5 bg-[var(--google-blue)]/10 text-[var(--google-blue)] border border-[var(--google-blue)]/20 rounded-full uppercase tracking-tighter">
                  {item.params.mode}
                </span>
                <span className="text-[8px] sm:text-[9px] px-2 py-0.5 bg-[var(--google-green)]/10 text-[var(--google-green)] border border-[var(--google-green)]/20 rounded-full uppercase tracking-tighter">
                  {item.params.aspectRatio}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--card-border)]/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest group/btn"
                >
                  <Zap className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                  Generate Similar
                </button>
                
                <div className="opacity-0 group-hover:opacity-100 transition-all">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--google-blue)]" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
