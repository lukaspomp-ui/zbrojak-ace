import { motion } from "framer-motion";

/**
 * Readiness ring. Fills progressively on load like loading a magazine
 * (stepped keyframes), with tabular numbers in the middle.
 */
export function ProgressRing({
  value,
  size = 132,
  label = "zvládnuto",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const target = circumference - (clamped / 100) * circumference;
  const steps = 6;
  const keyframes = Array.from({ length: steps + 1 }, (_, i) => {
    const pct = (clamped * i) / steps;
    return circumference - (pct / 100) * circumference;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="rgba(255,255,255,0.08)"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="var(--primary)"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: [...keyframes, target] }}
          transition={{ duration: 1.1, ease: "easeOut", times: undefined }}
          style={{
            filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 55%, transparent))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-3xl font-extrabold">{Math.round(clamped)}%</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
