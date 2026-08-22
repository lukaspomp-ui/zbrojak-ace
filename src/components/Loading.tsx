import { Loader2 } from "lucide-react";
import { LOADING_LINES } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Nabíjecí stav s hláškou ze střelnice. */
export function Loading({
  full = true,
  line,
  className,
}: {
  full?: boolean;
  line?: string;
  className?: string;
}) {
  const text = line ?? LOADING_LINES[0]!;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        full ? "min-h-screen" : "py-14",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
