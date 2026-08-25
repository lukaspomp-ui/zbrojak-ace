import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/zasady-soukromi")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Zásady soukromí — Zbrojní průkaz 2026" },
      { name: "description", content: "Zásady ochrany osobních údajů aplikace Zbrojní průkaz 2026." },
    ],
  }),
  component: PrivacyPage,
});

const UPDATED = "25. 8. 2026";
const APP = "Zbrojní průkaz 2026";
const CONTACT = "info@zbrojak2026.cz"; // TODO: aktualizovat na skutečný e-mail

function PrivacyPage() {
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
          <p className="text-xs text-muted-foreground">Právní informace</p>
          <h1 className="text-lg font-extrabold">Zásady soukromí</h1>
        </div>
        <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-foreground">

        {/* Datum */}
        <p className="text-xs text-muted-foreground">
          Platnost od: {UPDATED}
        </p>

        {/* CZ */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-bold">🇨🇿 Česky</h2>

          <div>
            <h3 className="mb-1 font-semibold">1. Provozovatel</h3>
            <p>
              Aplikaci <strong>{APP}</strong> provozuje fyzická osoba nebo
              společnost uvedená jako vydavatel v příslušném obchodě s
              aplikacemi. Kontakt: <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">2. Jaké údaje sbíráme</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li><strong className="text-foreground">E-mailová adresa</strong> — při registraci nebo přihlášení (Google / Apple / e-mail).</li>
              <li><strong className="text-foreground">Pokrok v učení</strong> — zodpovězené otázky, výsledky testů, statistiky (ukládáno v Supabase).</li>
              <li><strong className="text-foreground">Platební informace</strong> — při nákupu Premium jsou zpracovávány výhradně platební bránou Paddle.com; karta ani jiné platební údaje nejsou ukládány provozovatelem.</li>
              <li><strong className="text-foreground">Technické údaje</strong> — typ zařízení, OS, verze aplikace (anonymní, pro ladění chyb).</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">3. K čemu údaje používáme</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Provoz a zlepšování aplikace.</li>
              <li>Synchronizace pokroku napříč zařízeními.</li>
              <li>Zpracování plateb a ověření Premium přístupu.</li>
              <li>Zasílání transakčních e-mailů (potvrzení nákupu, reset hesla).</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">4. Sdílení s třetími stranami</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> — databáze a autentizace (EU servery).</li>
              <li><strong className="text-foreground">Paddle</strong> — platební brána (merchant of record, řeší DPH).</li>
              <li><strong className="text-foreground">Google / Apple</strong> — přihlášení přes účet (OAuth).</li>
            </ul>
            <p className="mt-2 text-muted-foreground">Vaše osobní údaje neprodáváme ani neposkytujeme jiným třetím stranám za účelem marketingu.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">5. Reklamy</h3>
            <p className="text-muted-foreground">Aplikace <strong className="text-foreground">neobsahuje žádné reklamy</strong> a nesdílí data s reklamními sítěmi.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">6. Ukládání a zabezpečení</h3>
            <p className="text-muted-foreground">
              Data jsou uložena na serverech Supabase v EU a chráněna šifrováním (TLS v přenosu, AES-256 v klidu). Lokální data (pokrok, oblíbené, statistiky) jsou uložena v paměti zařízení (localStorage) a neopouštějí zařízení bez vašeho vědomí.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">7. Vaše práva (GDPR)</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Právo na přístup k údajům.</li>
              <li>Právo na opravu nebo výmaz (smazání účtu).</li>
              <li>Právo na přenositelnost dat.</li>
              <li>Právo vznést námitku nebo odvolat souhlas.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">Pro uplatnění práv nás kontaktujte na <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>. Odpovíme do 30 dnů.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">8. Cookies a tracking</h3>
            <p className="text-muted-foreground">Aplikace nepoužívá analytické ani marketingové cookies. Používá technické localStorage pro uložení pokroku a nastavení.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">9. Změny zásad</h3>
            <p className="text-muted-foreground">O podstatných změnách vás budeme informovat v aplikaci nebo e-mailem. Aktuální verze je vždy dostupná na této stránce.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* EN */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-bold">🇬🇧 English (Privacy Policy)</h2>

          <div>
            <h3 className="mb-1 font-semibold">1. Controller</h3>
            <p>
              <strong>{APP}</strong> is operated by the individual or entity
              listed as the publisher in the respective app store. Contact:{" "}
              <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">2. Data we collect</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Email address</strong> — when registering or signing in (Google / Apple / email).</li>
              <li><strong className="text-foreground">Learning progress</strong> — answered questions, test results, statistics (stored in Supabase).</li>
              <li><strong className="text-foreground">Payment information</strong> — processed solely by Paddle.com; no card data is stored by us.</li>
              <li><strong className="text-foreground">Technical data</strong> — device type, OS, app version (anonymous, for debugging).</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">3. How we use your data</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Operating and improving the app.</li>
              <li>Syncing progress across devices.</li>
              <li>Processing payments and verifying Premium access.</li>
              <li>Sending transactional emails (purchase confirmation, password reset).</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">4. Third-party sharing</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> — database and auth (EU servers).</li>
              <li><strong className="text-foreground">Paddle</strong> — payment processing (merchant of record, handles VAT).</li>
              <li><strong className="text-foreground">Google / Apple</strong> — OAuth sign-in.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">We do not sell or share your personal data with other third parties for marketing purposes.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">5. Advertising</h3>
            <p className="text-muted-foreground">The app contains <strong className="text-foreground">no advertisements</strong> and does not share data with ad networks.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">6. Storage and security</h3>
            <p className="text-muted-foreground">Data is stored on Supabase servers in the EU, protected by TLS in transit and AES-256 at rest. Local data (progress, favourites, statistics) is stored in device memory (localStorage) and does not leave the device without your knowledge.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">7. Your rights (GDPR)</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Right of access.</li>
              <li>Right to rectification or erasure (account deletion).</li>
              <li>Right to data portability.</li>
              <li>Right to object or withdraw consent.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">To exercise your rights, contact us at <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>. We will respond within 30 days.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">8. Cookies and tracking</h3>
            <p className="text-muted-foreground">The app does not use analytical or marketing cookies. It uses localStorage for saving progress and settings.</p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold">9. Changes to this policy</h3>
            <p className="text-muted-foreground">We will notify you of material changes via the app or email. The current version is always available on this page.</p>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          {APP} · Poslední aktualizace: {UPDATED}
        </p>

      </div>
    </main>
  );
}
