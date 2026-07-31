import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-lg shadow-black/30 active:scale-[0.98]",
  outline:
    "border border-border bg-card text-foreground active:scale-[0.98] hover:bg-elevated",
  ghost: "text-muted-foreground hover:text-foreground",
  danger: "bg-destructive text-destructive-foreground active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  full,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        full && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}
