import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Zbroják 2026 — iOS (Capacitor).
 *
 * The app is a server-rendered TanStack Start app, so the native shell loads the
 * published site instead of a static bundle. `webDir` only holds the offline
 * fallback page that ships inside the .ipa.
 */
const config: CapacitorConfig = {
  appId: "cz.zbrojak2026.app",
  appName: "Zbroják 2026",
  webDir: "mobile/www",
  ios: {
    contentInset: "never",
    backgroundColor: "#0a0a0d",
  },
  server: {
    url: "https://zbrojak-ace.lovable.app",
    cleartext: false,
    allowNavigation: ["zbrojak-ace.lovable.app", "*.lovable.app", "*.supabase.co"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0a0a0dff",
      showSpinner: false,
      iosSpinnerStyle: "small",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0d",
      overlaysWebView: true,
    },
  },
};

export default config;
