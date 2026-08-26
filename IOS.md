# Zbroják 2026 — vydání do App Store (iOS)

Aplikace je nativní iOS obal (Capacitor), který uvnitř zobrazuje publikovanou
webovou aplikaci `https://zbrojak-ace.lovable.app`. Web a iOS tak sdílí jednu
kódovou základnu a obsah se aktualizuje bez nového buildu v App Store.

## Co je hotové v repozitáři

- `capacitor.config.ts` — bundle ID `cz.zbrojak2026.app`, název „Zbroják 2026“,
  tmavé pozadí `#0a0a0d`, splash screen a status bar.
- `mobile/www/index.html` — offline fallback obrazovka uvnitř .ipa.
- `mobile/assets/icon.png` + `mobile/assets/splash.png` — zdroje pro generování
  všech iOS ikon a launch screenů.
- `src/lib/native.ts` — skryje splash screen, nastaví status bar a vypne service
  worker v nativní appce.
- `codemagic.yaml` — kompletní CI workflow: build, podpis, export .ipa a upload
  do TestFlight.

## Jednorázová příprava (potřebuješ Apple Developer Program, 99 USD/rok)

1. **App Store Connect** → vytvoř novou aplikaci:
   - Platforma: iOS
   - Bundle ID: `cz.zbrojak2026.app` (nejdřív ho zaregistruj v Certificates,
     Identifiers & Profiles)
   - SKU: `zbrojak2026`
   - Primární jazyk: čeština
2. **Codemagic** → připoj repozitář, přidej integraci „App Store Connect“
   (API key: Issuer ID, Key ID, .p8 soubor) a v nastavení workflow zapni
   automatické podepisování (`ios_signing` už je v `codemagic.yaml`).
3. Spusť workflow `ios-app-store`. Výsledkem je .ipa nahraná do TestFlight.

## Lokální build na Macu

```bash
bun install
bun run cap:add:ios     # jednorázově vygeneruje ios/ projekt
bun run cap:sync
bun run cap:assets      # ikony + splash
bun run cap:open        # otevře Xcode
```

V Xcode nastav svůj Team, pak Product → Archive → Distribute App.

## Podklady pro App Store (připrav v App Store Connect)

- **Název:** Zbroják 2026
- **Podtitul:** Příprava na zkoušku zbrojního průkazu
- **Kategorie:** Vzdělávání (sekundární: Reference)
- **Popis:** 837 oficiálních otázek, ostrý test podle skupiny A–E, procvičování
  po okruzích, mé chyby, statistiky připravenosti, slovníček a dokumenty.
- **Klíčová slova:** zbrojní průkaz, zbroják, testy, otázky, zkouška, zbraně,
  střelba, 2026
- **Věkové hodnocení:** 17+ (téma zbraní a střelných zbraní)
- **Zásady soukromí:** https://zbrojak-ace.lovable.app/zasady-soukromi
- **Support URL:** https://zbrojak-ace.lovable.app
- **Screenshoty:** 6.7" (1290×2796) a 6.5" (1242×2688) — dashboard, ostrý test,
  vyhodnocení, statistiky, profil.
- **Testovací účet pro review:** e-mail + heslo demo účtu (App Review ho vyžaduje,
  protože je v appce přihlášení).

## Na co si dát pozor při schvalování

1. **Guideline 4.2 (minimální funkčnost):** appka nesmí být jen webview odkaz.
   Splňujeme díky nativnímu splash screenu, offline fallbacku, ikoně a plnému
   nativnímu status baru a uzamčení na portrait režim.
2. **Guideline 3.1.1 (in-app nákupy):** jakmile bude Premium za 99 Kč prodejné
   v iOS appce, MUSÍ jít přes Apple In-App Purchase. Do té doby nesmí být v iOS
   verzi žádné odkazy na externí platbu ani cena — jinak přijde odmítnutí.
3. **Guideline 5.1.1 (mazání účtu):** už je splněno tlačítkem „Smazat účet“
   v profilu.
4. **Sign in with Apple:** povinné, protože nabízíme Google login — tlačítko
   „Pokračovat s Apple“ je na přihlašovací obrazovce.
