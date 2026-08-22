import { useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Briefcase,
  Check,
  Medal,
  PawPrint,
  Shield,
  type LucideIcon,
} from "lucide-react";

import {
  DEFAULT_GROUP,
  LICENSE_GROUPS,
  type LicenseGroupId,
} from "@/lib/license-group";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Archive,
  Medal,
  PawPrint,
  Briefcase,
  Shield,
};

export function LicenseGroupPicker({
  initialId,
  onChange,
}: {
  initialId?: LicenseGroupId;
  onChange?: (id: LicenseGroupId) => void;
}) {
  const [selected, setSelected] = useState<LicenseGroupId>(
    initialId ?? DEFAULT_GROUP,
  );

  function pick(id: LicenseGroupId) {
    setSelected(id);
    onChange?.(id);
  }

  return (
    <div className="flex flex-col gap-3">
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
            onClick={() => pick(g.id)}
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
    </div>
  );
}
