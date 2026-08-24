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

  async function signInWithGoogle() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Přihlášení přes Google se nepovedlo.");
        return;
      }
      if (result.redirected) return;
      toast.success("Přihlášeno.");
      navigate({ to: "/" });
    } catch {
      toast.error("Přihlášení přes Google se nepovedlo.");
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
          <Button full variant="outline" type="button" disabled={busy} onClick={signInWithGoogle}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
              />
            </svg>
            Pokračovat s Google
          </Button>
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
