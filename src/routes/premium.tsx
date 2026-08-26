import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/use-auth";
import { useAppQuery, useAppTheme, useProfileQuery } from "@/hooks/use-exam-data";
import { PAYWALL_COPY } from "@/lib/app-config";
import { unlockPremium } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/premium")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Premium — Uděláš zbroják napoprvé" },
      {
        name: "description",
        content:
          "Odemkni kompletní databázi otázek, chytré opakování chyb a vysvětlení paragrafů. 99 Kč jednorázově.",
      },
      { property: "og:title", content: "Premium — Uděláš zbroják napoprvé" },
      {
        property: "og:description",
        content:
          "Kompletní databáze otázek, chytré opakování chyb a garance aktualizace pro rok 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Paywall,
});

function Paywall() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, isGuest, ready } = useAuth();
  const { data: app } = useAppQuery();
  const { data: profile } = useProfileQuery();
  useAppTheme(app);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUpAndUnlock() {
    if (!email || password.length < 6) {
      toast.error("Zadej e-mail a heslo (min. 6 znaků).");
      return;
    }
    setBusy(true);
    try {
      // Guests upgrade their anonymous session to a real account.
      const { error } = isGuest
        ? await supabase.auth.updateUser({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
      if (error) throw error;
      await purchase();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registrace se nepovedla.");
    } finally {
      setBusy(false);
    }
  }

  async function purchase() {
    if (!userId) return;
    setBusy(true);
    try {
      // Placeholder: real in-app purchase gets wired here later.
      await unlockPremium(userId);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Premium aktivováno. Hodně štěstí u zkoušky!");
      navigate({ to: "/" });
    } catch {
      toast.error("Aktivace se nepovedla. Zkus to prosím znovu.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.is_premium) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5">
        <div className="card-surface p-6 text-center">
          <span className="tint-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <Crown className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-bold">Máš Premium</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Celá databáze i procvičování chyb jsou odemčené.
          </p>
          <Link to="/" className="mt-5 block">
            <Button full>Zpět na přehled</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 pt-6 safe-bottom">
      <Link
        to="/"
        className="card-surface w-fit rounded-full p-2.5 text-muted-foreground"
        aria-label="Zpět"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <span className="tint-primary flex h-12 w-12 items-center justify-center rounded-2xl">
          <Crown className="h-5 w-5" />
        </span>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight">{PAYWALL_COPY.headline}</h1>
        <p className="text-sm text-muted-foreground">{PAYWALL_COPY.sub}</p>
      </motion.section>

      <ul className="card-surface flex flex-col gap-3.5 p-5">
        {PAYWALL_COPY.benefits.map((benefit, i) => (
          <motion.li
            key={benefit}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-start gap-3 text-sm"
          >
            <span className="tint-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <Check className="h-3 w-3" />
            </span>
            {benefit}
          </motion.li>
        ))}
      </ul>

      <div className="flex items-baseline justify-center gap-2">
        <span className="text-2xl font-bold">{PAYWALL_COPY.price}</span>
      </div>

      {isGuest ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-muted-foreground">
            Vytvoř si účet, aby ti Premium a pokrok zůstaly i po přeinstalaci.
          </p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tvuj@email.cz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Heslo (min. 6 znaků)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <Button full onClick={signUpAndUnlock} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Odemknout za 99 Kč
          </Button>
        </div>
      ) : (
        <Button full onClick={purchase} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Odemknout za 99 Kč
        </Button>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Jednorázová platba, žádné předplatné ani reklamy.
      </p>
    </main>
  );
}
