import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Jednotná hlavička podstránek — stejný jazyk jako úvodní obrazovka:
 * kruhové "card-surface" zpět, blaze ikonka a extrabold titulek s mosazným popiskem.
 */
export function PageHeader({
  title,
  eyebrow,
  icon: Icon,
  right,
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3">
      <Link
        to="/"
        className="card-surface shrink-0 rounded-full p-2.5 text-muted-foreground"
        aria-label="Zpět"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      {Icon && (
        <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="label-tick">{eyebrow}</p>}
        <h1 className="truncate text-[17px] font-extrabold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

/** Malý mosazný nadpis sekce — stejný jako na úvodní stránce. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="label-tick">
      <span className="h-2 w-2 shrink-0 rounded-full bg-brass" />
      {children}
    </h2>
  );
}
