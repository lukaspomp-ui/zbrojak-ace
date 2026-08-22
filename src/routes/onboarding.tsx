import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Archive,
  Briefcase,
  Check,
  ChevronRight,
  Medal,
  PawPrint,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { ScopeReticle } from "@/components/ScopeReticle";
import {
  DEFAULT_GROUP,
  LICENSE_GROUPS,
  setLicenseGroup,
  type LicenseGroupId,
} from "@/lib/license-group";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Archive,
  Medal,
  PawPrint,
  Briefcase,
  Shield,
};

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vyber svou skupinu — Zbrojní průkaz 2026" },
      {
        name: "description",
        content: "Vyber skupinu zbrojního průkazu a začni se připravovat.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<LicenseGroupId>(DEFAULT_GROUP);

  const confirm = () => {
    setLicenseGroup(selected);
    navigate({ to: "/", replace: true });
  };

  const skip = () => {
    setLicenseGroup(DEFAULT_GROUP);
    navigate({ to: "/", replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-5 py-8 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden text-center"
      >
        <ScopeReticle
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 text-primary"
          opacity={0.12}
        />
        <span className="tint-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
          <Target className="h-8 w-8" />
        </span>
        <h1 className="relative mt-5 text-2xl font-extrabold leading-tight">
          Vyber svou skupinu
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Podle skupiny nastavíme hranici úspěchu. Otázky jsou pro všechny
          stejné.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        {LICENSE_GROUPS.map((g, i) => {
          const Icon = GROUP_ICONS[g.iconName];
          const active = selected === g.id;
          return (
            <motion.button
              key={g.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => setSelected(g.id)}
              aria-pressed={active}
              className={
                active
                  ? "card-surface flex items-center gap-4 border border-primary bg-primary/10 p-4 text-left"
                  : "card-surface flex items-center gap-4 p-4 text-left"
              }
            >
              <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">
                  {g.id} — {g.purpose}
                </span>
                <span className="num block text-xs text-muted-foreground">
                  {g.scopeLabel} · {g.passCorrect} z 30
                </span>
              </span>
              {active ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full border border-muted-foreground/30" />
              )}
            </motion.button>
          );
        })}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        <Button full onClick={confirm}>
          Pokračovat
          <ChevronRight className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={skip}
          className="text-center text-xs text-muted-foreground underline"
        >
          Přeskočit — použít skupinu {DEFAULT_GROUP}
        </button>
      </motion.div>
    </main>
  );
}
