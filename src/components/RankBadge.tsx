import { Medal } from "lucide-react";
import { rankFor } from "@/lib/ranks";
import { cn } from "@/lib/utils";

/** Brass rank badge, optionally with progress to the next rank. */
export function RankBadge({
  mastered,
  detailed,
  className,
}: {
  mastered: number;
  detailed?: boolean;
  className?: string;
}) {
  const { current, next, toNext, percentToNext } = rankFor(mastered);

  if (!detailed) {
    return (
      <span
        className={cn(
          "tint-brass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
          className,
        )}
      >
        <Medal className="h-3.5 w-3.5" />
        {current.name}
      </span>
    );
  }

  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="label-tick">Hodnost</span>
        <span className="text-brass num text-xs font-semibold">
          {mastered} zvládnuto
        </span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-brass">{current.name}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${percentToNext}%`,
            backgroundColor: "var(--brass)",
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {next
          ? `Do hodnosti ${next.name} zbývá ${toNext} otázek`
          : "Nejvyšší hodnost — terč je tvůj."}
      </p>
    </div>
  );
}
