import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/Button";

const CONTACT = "lukas.pomp@gmail.com";

export const Route = createFileRoute("/smazat-ucet")({
  head: () => ({
    meta: [
      { title: "Smazání účtu a dat — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Jak požádat o smazání účtu a všech dat v aplikaci Zbrojní průkaz 2026. Žádost vyřídíme do 30 dnů.",
      },
      { property: "og:title", content: "Smazání účtu a dat — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Požádej o smazání účtu a všech souvisejících dat. Vyřídíme do 30 dnů.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeleteAccountPage,
});

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Zadej e-mail." })
  .email({ message: "Zadej platný e-mail." })
  .max(255, { message: "E-mail je příliš dlouhý." });

function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Neplatný e-mail.");
      return;
    }
    setError(null);
    const subject = encodeURIComponent("Smazání účtu");
    const body = encodeURIComponent(
      `Žádám o smazání svého účtu a všech souvisejících dat v aplikaci Zbrojní průkaz 2026.\n\nE-mail účtu: ${parsed.data}\n`,
    );
    window.location.href = `mailto:${CONTACT}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 safe-bottom">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          aria-label="Zpět"
          className="card-surface rounded-full p-2.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground">Účet a data</p>
          <h1 className="text-lg font-extrabold">Smazání účtu a dat</h1>
        </div>
        <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Trash2 className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <section className="card-surface flex flex-col gap-2 p-5">
          <h2 className="text-base font-bold">Co se smaže</h2>
          <p className="text-muted-foreground">
            Smažeme tvůj účet i všechna související data:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>přihlašovací účet (e-mail, přihlášení přes Apple/Google)</li>
            <li>pokrok v učení a stav zvládnutých otázek</li>
            <li>statistiky a úspěšnost</li>
            <li>oblíbené otázky</li>
            <li>historie ostrých testů</li>
          </ul>
        </section>

        <section className="card-surface flex flex-col gap-2 p-5">
          <h2 className="text-base font-bold">Co se uchovává a proč</h2>
          <p className="text-muted-foreground">
            Dlouhodobě neuchováváme nic. Po smazání nezůstávají žádné profilové ani
            studijní údaje. Výjimkou mohou být pouze anonymní záznamy bez vazby na
            tvou osobu (např. technické provozní logy) a doklady o případném nákupu,
            které si po dobu vyžadovanou zákonem uchovává obchod s aplikacemi
            (App Store / Google Play) — k těm nemáme přístup.
          </p>
        </section>

        <section className="card-surface flex flex-col gap-2 p-5">
          <h2 className="text-base font-bold">Za jak dlouho</h2>
          <p className="text-muted-foreground">
            Žádost vyřídíme a data smažeme nejpozději do 30 dnů od jejího doručení.
            Pokud smazání provedeš přímo v aplikaci v sekci Profil, proběhne okamžitě.
          </p>
        </section>

        <section className="card-surface flex flex-col gap-3 p-5">
          <h2 className="text-base font-bold">Jak požádat</h2>
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <p className="font-semibold">Žádost byla připravena k odeslání</p>
              <p className="text-xs text-muted-foreground">
                Otevřel se tvůj e-mailový klient s předplněnou zprávou pro {CONTACT}.
                Po odeslání ti smazání potvrdíme, nejpozději do 30 dnů.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Zadat jiný e-mail
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
              <label htmlFor="email" className="text-xs text-muted-foreground">
                E-mail tvého účtu
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tvuj@email.cz"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-[15px] outline-none focus:border-primary"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" full>
                Požádat o smazání
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            Nebo napiš na{" "}
            <a href={`mailto:${CONTACT}`} className="text-primary underline">
              {CONTACT}
            </a>{" "}
            s předmětem <strong>Smazání účtu</strong>.
          </p>
        </section>

        <Link
          to="/zasady-soukromi"
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Zásady soukromí
        </Link>
      </div>
    </main>
  );
}
