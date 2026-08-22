import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ScopeReticle } from "./ScopeReticle";

const COMMANDS = ["Připravit…", "Pozor…", "Pal!"];

/** Krátký povelový odpočet před ostrým testem. Nemění logiku testu. */
export function RangeCountdown({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= COMMANDS.length) {
      const id = window.setTimeout(onDone, 260);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, onDone]);

  const label = COMMANDS[Math.min(step, COMMANDS.length - 1)]!;
  const isFire = step >= COMMANDS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <ScopeReticle
        className="pointer-events-none absolute h-[86vw] max-h-[420px] w-[86vw] max-w-[420px] text-primary"
        opacity={0.22}
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={label}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative text-center text-4xl font-extrabold tracking-tight"
          style={{ color: isFire ? "var(--primary)" : undefined }}
        >
          {label}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
