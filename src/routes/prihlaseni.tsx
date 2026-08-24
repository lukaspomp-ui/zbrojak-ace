import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Apple, ArrowLeft, KeyRound, Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAppQuery, useAppTheme } from "@/hooks/use-exam-data";


export const Route = createFileRoute("/prihlaseni")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Přihlášení — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Přihlas se ke svému účtu a měj svůj pokrok v přípravě na zbrojní průkaz vždy s sebou.",
      },
      { property: "og:title", content: "Přihlášení — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Přihlas se a pokračuj v přípravě na zbrojní průkaz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup" | "forgot";

function LoginPage() {
  const navigate = useNavigate();
  const { data: app } = useAppQuery();
  useAppTheme(app);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-hesla`,
        });
        if (error) throw error;
        toast.success("Odkaz pro obnovení hesla jsme poslali na e-mail.");
        setMode("signin");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Účet vytvořen.");
          navigate({ to: "/" });
        } else {
          toast.success("Potvrď prosím registraci v e-mailu.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Přihlášeno.");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Něco se nepovedlo. Zkus to znovu.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithApple() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Přihlášení přes Apple se nepovedlo.");
        return;
      }
      if (result.redirected) return;
      toast.success("Přihlášeno.");
      navigate({ to: "/" });
    } catch {
      toast.error("Přihlášení přes Apple se nepovedlo.");
    } finally {
      setBusy(false);
    }
  }



  const title =
    mode === "forgot" ? "Obnovit heslo" : mode === "signup" ? "Vytvořit účet" : "Přihlášení";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10 safe-bottom">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="card-surface shrink-0 rounded-full p-2.5 text-muted-foreground"
          aria-label="Zpět"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[17px] font-extrabold leading-tight">{title}</h1>
      </header>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="card-surface flex flex-col gap-3 p-5"
      >
        <label className="text-xs font-semibold text-muted-foreground">
          {mode === "forgot" ? "Zadejte svůj e-mail" : "E-mail"}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@email.cz"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {mode !== "forgot" && (
          <>
            <label className="text-xs font-semibold text-muted-foreground">Heslo</label>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-elevated px-3">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </>
        )}

        <Button full type="submit" disabled={busy} className="mt-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {mode === "forgot"
            ? "Obnovit heslo"
            : mode === "signup"
              ? "Zaregistrovat se"
              : "Přihlásit se"}
        </Button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="mt-1 text-center text-xs font-medium text-primary underline"
          >
            Zapomněli jste heslo?
          </button>
        )}
      </motion.form>

      {mode !== "forgot" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              nebo
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button full variant="outline" type="button" disabled={busy} onClick={signInWithApple}>
            <Apple className="h-4 w-4" />
            Pokračovat s Apple
          </Button>
        </div>
      )}



      <div className="text-center text-xs text-muted-foreground">
        {mode === "signup" ? (
          <button type="button" onClick={() => setMode("signin")} className="underline">
            Už máš účet? Přihlas se
          </button>
        ) : (
          <button type="button" onClick={() => setMode("signup")} className="underline">
            Nemáš účet? Zaregistrovat se
          </button>
        )}
      </div>
    </main>
  );
}
