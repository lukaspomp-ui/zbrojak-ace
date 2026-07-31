import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuth } from "@/hooks/use-auth";
import {
  useAppQuery,
  useAppTheme,
  useProfileQuery,
  useProgressQuery,
  useQuestionsQuery,
} from "@/hooks/use-exam-data";
import { availableQuestions } from "@/lib/data";
import { deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Můj profil — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Spravuj svůj účet, heslo a sleduj svůj pokrok v přípravě na zbrojní průkaz 2026.",
      },
      { property: "og:title", content: "Můj profil — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Spravuj svůj účet, heslo a sleduj svůj pokrok.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ready, session, isGuest } = useAuth();
  const { data: app } = useAppQuery();
  const { data: profile } = useProfileQuery();
  const { data: questions } = useQuestionsQuery();
  const { data: progress } = useProgressQuery();
  useAppTheme(app);

  const [changing, setChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isPremium = profile?.is_premium === true;
  const pool = availableQuestions(questions ?? [], isPremium);
  const masteredCount = (progress ?? []).filter(
    (p) => p.mastered && pool.some((q) => q.id === p.question_id),
  ).length;
  const percent = pool.length
    ? Math.round((masteredCount / pool.length) * 100)
    : 0;

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/prihlaseni" });
  }

  async function removeAccount() {
    if (
      !window.confirm(
        "Opravdu chceš smazat účet? Přijdeš o veškerý pokrok a tuto akci nelze vzít zpět.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      queryClient.clear();
      toast.success("Účet byl smazán.");
      navigate({ to: "/prihlaseni" });
    } catch {
      toast.error("Účet se nepovedlo smazat. Zkus to prosím znovu.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 pt-8 safe-bottom">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-card p-2.5 text-muted-foreground"
          aria-label="Zpět"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Můj profil</h1>
      </header>

      {isGuest ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface flex flex-col items-center gap-4 p-6 text-center"
        >
          <span className="tint-primary flex h-16 w-16 items-center justify-center rounded-3xl">
            <UserPlus className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-base font-bold">Zkoušíš jako host</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Zaregistruj se a svůj pokrok budeš mít uložený na všech
              zařízeních.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Link to="/prihlaseni">
              <Button full>Zaregistrovat se</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" full>
                Zpět na přehled
              </Button>
            </Link>
          </div>
        </motion.section>
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface flex flex-col gap-4 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="truncate text-[15px] font-semibold">
                  {session?.user.email ?? "—"}
                </p>
              </div>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                  isPremium
                    ? "tint-primary"
                    : "bg-elevated text-muted-foreground",
                )}
              >
                {isPremium && <Crown className="h-3.5 w-3.5" />}
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>

            <div className="flex items-center gap-5 border-t border-border pt-4">
              <ProgressRing value={percent} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Tvůj pokrok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zvládnuto {masteredCount} z {pool.length} otázek ({percent} %)
                </p>
              </div>
            </div>
          </motion.section>

          <section className="flex flex-col gap-2.5">
            <Button variant="outline" full onClick={() => setChanging(true)}>
              <KeyRound className="h-4 w-4" />
              Změnit heslo
            </Button>
            <Button variant="outline" full onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Odhlásit se
            </Button>
            <Button
              variant="danger"
              full
              onClick={removeAccount}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Smazat účet
            </Button>
          </section>
        </>
      )}

      {changing && <ChangePasswordModal onClose={() => setChanging(false)} />}
    </main>
  );
}
