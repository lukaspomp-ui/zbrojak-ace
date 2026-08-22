import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { supabase } from "@/integrations/supabase/client";
import { useAppQuery, useAppTheme } from "@/hooks/use-exam-data";

export const Route = createFileRoute("/reset-hesla")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Obnovit heslo — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Nastav si nové heslo ke svému účtu v přípravě na zbrojní průkaz 2026.",
      },
      { property: "og:title", content: "Obnovit heslo — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Nastav si nové heslo ke svému účtu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { data: app } = useAppQuery();
  useAppTheme(app);

  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = again.length > 0 && password !== again;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || mismatch) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Heslo bylo změněno.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Heslo se nepovedlo změnit. Zkus to znovu.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10 safe-bottom">
      <div className="flex flex-col items-center text-center">
        <span className="tint-primary mb-4 flex h-16 w-16 items-center justify-center rounded-3xl">
          <ShieldCheck className="h-8 w-8" />
        </span>
        <h1 className="text-xl font-extrabold">Obnovit heslo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zadej své nové heslo. Pak už můžeš pokračovat v procvičování.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="card-surface flex flex-col gap-3 p-5"
      >
        <label className="text-xs font-semibold text-muted-foreground">
          Nové heslo
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3">
          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <label className="text-xs font-semibold text-muted-foreground">
          Nové heslo znovu
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3">
          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {mismatch && (
          <p className="text-xs font-medium text-destructive">
            Hesla se neshodují.
          </p>
        )}

        <Button full type="submit" disabled={busy || mismatch} className="mt-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Změnit heslo
        </Button>
      </motion.form>
    </main>
  );
}
