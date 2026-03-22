import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles, Cpu, Zap, Activity } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  message: string;
  subMessage?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message, subMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-8 w-full max-w-2xl mx-auto">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-2 border-dashed border-indigo-500/20"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-dashed border-purple-500/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl"
            >
              <Loader2 className="w-10 h-10 sm:w-16 sm:h-16 text-indigo-400 animate-spin" />
            </motion.div>
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 w-full">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-2xl font-bold text-[var(--fg)] tracking-tight uppercase">
            {message || 'Initializing Production'}
          </h3>
          {subMessage && (
            <p className="text-xs sm:text-sm text-[var(--muted)] font-medium uppercase tracking-[0.2em]">
              {subMessage}
            </p>
          )}
        </div>

        <div className="relative h-1.5 w-full bg-[var(--card-bg)] rounded-full overflow-hidden border border-[var(--card-border)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--google-blue)] via-[var(--google-red)] via-[var(--google-yellow)] to-[var(--google-green)] shadow-[0_0_15px_rgba(66,133,244,0.3)]"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-indigo-500" />
            <span>Engine Active</span>
          </div>
          <span>{Math.round(progress)}% Complete</span>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-purple-500" />
            <span>Neural Processing</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full pt-8">
        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center gap-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[8px] text-[var(--muted)] uppercase font-bold tracking-widest">Power</span>
            <span className="text-[10px] text-[var(--fg)] font-mono">OPTIMIZED</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center gap-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[8px] text-[var(--muted)] uppercase font-bold tracking-widest">Latency</span>
            <span className="text-[10px] text-[var(--fg)] font-mono">MINIMAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
