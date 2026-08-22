import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "btn-blaze active:scale-[0.98]",
  outline:
    "card-surface text-foreground active:scale-[0.98] hover:bg-elevated",
  ghost: "text-muted-foreground hover:text-foreground",
  danger:
    "bg-destructive text-destructive-foreground shadow-lg shadow-black/40 active:scale-[0.98]",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold tracking-tight transition-all disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        full && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}
