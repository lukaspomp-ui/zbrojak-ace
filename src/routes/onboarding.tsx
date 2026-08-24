import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { LicenseGroupPicker } from "@/components/LicenseGroupPicker";
import { ScopeReticle } from "@/components/ScopeReticle";
import {
  DEFAULT_GROUP,
  hasChosenLicenseGroup,
  setLicenseGroup,
  type LicenseGroupId,
} from "@/lib/license-group";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasChosenLicenseGroup()) {
      navigate({ to: "/", replace: true });
    }
  }, [navigate]);

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
        <h1 className="relative mt-5 text-2xl font-extrabold leading-tight">Vyber svou skupinu</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Podle skupiny nastavíme hranici úspěchu. Otázky jsou pro všechny stejné.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <LicenseGroupPicker initialId={selected} onChange={setSelected} />
      </motion.div>

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
