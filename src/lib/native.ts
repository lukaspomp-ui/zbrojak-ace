/**
 * Native (Capacitor) runtime helpers.
 *
 * The same web build runs in the browser and inside the iOS shell, so every
 * plugin call is lazy-loaded and no-ops on the web.
 */

let cachedIsNative: boolean | null = null;

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedIsNative !== null) return cachedIsNative;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  cachedIsNative = Boolean(cap?.isNativePlatform?.());
  return cachedIsNative;
}

/** Hides the launch screen and matches the status bar to the dark theme. */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
  } catch {
    // Plugin missing (web build) — nothing to do.
  }
}
