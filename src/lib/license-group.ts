import { useEffect, useState } from "react";

export type LicenseGroupId = "A" | "B" | "C" | "D" | "E";
export type LicenseScope = "obecne" | "rozsirene";

export type LicenseGroup = {
  id: LicenseGroupId;
  purpose: string;
  scope: LicenseScope;
  scopeLabel: string;
  passCorrect: number;
  iconName: "Archive" | "Medal" | "PawPrint" | "Briefcase" | "Shield";
};

export const LICENSE_GROUPS: LicenseGroup[] = [
  {
    id: "A",
    purpose: "Sběratelské účely",
    scope: "obecne",
    scopeLabel: "Obecné oprávnění",
    passCorrect: 26,
    iconName: "Archive",
  },
  {
    id: "B",
    purpose: "Sportovní účely",
    scope: "obecne",
    scopeLabel: "Obecné oprávnění",
    passCorrect: 26,
    iconName: "Medal",
  },
  {
    id: "C",
    purpose: "Lovecké účely",
    scope: "obecne",
    scopeLabel: "Obecné oprávnění",
    passCorrect: 26,
    iconName: "PawPrint",
  },
  {
    id: "D",
    purpose: "Výkon povolání",
    scope: "rozsirene",
    scopeLabel: "Rozšířené oprávnění",
    passCorrect: 28,
    iconName: "Briefcase",
  },
  {
    id: "E",
    purpose: "Ochrana života, zdraví nebo majetku",
    scope: "rozsirene",
    scopeLabel: "Rozšířené oprávnění",
    passCorrect: 28,
    iconName: "Shield",
  },
];

const KEY = "zbrojak:license-group";
const LEGACY_KEY = "zbrojak:opravneni";
export const DEFAULT_GROUP: LicenseGroupId = "A";

export function groupById(id: LicenseGroupId): LicenseGroup {
  return LICENSE_GROUPS.find((g) => g.id === id) ?? LICENSE_GROUPS[0]!;
}

export function getLicenseGroup(): LicenseGroupId {
  if (typeof window === "undefined") return DEFAULT_GROUP;
  try {
    // Retire the old obecne/rozsirene value.
    window.localStorage.removeItem(LEGACY_KEY);
    const raw = window.localStorage.getItem(KEY);
    if (raw && LICENSE_GROUPS.some((g) => g.id === raw)) {
      return raw as LicenseGroupId;
    }
  } catch {
    /* storage unavailable — fall back to the default */
  }
  return DEFAULT_GROUP;
}

export function setLicenseGroup(id: LicenseGroupId) {
  try {
    window.localStorage.setItem(KEY, id);
    window.dispatchEvent(new Event("zbrojak:license-group-change"));
  } catch {
    /* best-effort */
  }
}

/** Selected licence group, kept in sync across components on the device. */
export function useLicenseGroup(): {
  group: LicenseGroup;
  select: (id: LicenseGroupId) => void;
} {
  const [id, setId] = useState<LicenseGroupId>(DEFAULT_GROUP);

  useEffect(() => {
    setId(getLicenseGroup());
    const sync = () => setId(getLicenseGroup());
    window.addEventListener("zbrojak:license-group-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("zbrojak:license-group-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    group: groupById(id),
    select: (next) => {
      setLicenseGroup(next);
      setId(next);
    },
  };
}
