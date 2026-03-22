import React from 'react';
import { motion } from 'motion/react';

const Logo: React.FC = () => {
  const text = "Video factory";
  const letters = Array.from(text);

  const googleColors = [
    'var(--google-blue)',
    'var(--google-red)',
    'var(--google-yellow)',
    'var(--google-blue)',
    'var(--google-green)',
    'var(--google-red)',
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: 0.12, 
        delayChildren: 0.1 * i,
      },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      y: 5,
      scale: 0.9,
      filter: "blur(4px)",
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="flex flex-wrap justify-center items-center overflow-hidden px-4"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            variants={child}
            style={{ color: googleColors[index % googleColors.length] }}
            className={`text-xl sm:text-5xl font-mono font-black tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] ${
              letter === " " ? "mr-1 sm:mr-4" : ""
            }`}
          >
            {letter}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear", times: [0, 0.5] }}
          className="w-2 h-6 sm:w-4 sm:h-10 bg-[var(--accent)] ml-1"
        />
      </motion.div>
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 1, ease: "circOut" }}
        className="h-[1px] w-32 bg-gradient-to-r from-[var(--google-blue)] via-[var(--google-red)] via-[var(--google-yellow)] to-[var(--google-green)] opacity-50" 
      />
    </div>
  );
};

export default Logo;
