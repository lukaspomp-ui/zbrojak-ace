import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../hooks/use-auth";
import { HudBackground } from "../components/HudBackground";
import { BottomNav } from "../components/BottomNav";
import { hasChosenLicenseGroup } from "../lib/license-group";
import { applyTheme, getThemeMode } from "../lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-lg font-semibold">Stránka nenalezena</h2>
        <p className="mt-2 text-sm text-muted-foreground">Tuto stránku jsme nenašli.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Zpět na přehled
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Něco se nepovedlo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zkus to prosím znovu nebo se vrať na přehled.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Zkusit znovu
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-input bg-card px-5 py-3 text-sm font-semibold"
          >
            Na přehled
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#0a0a0d" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "apple-mobile-web-app-title", content: "Zbroják 2026" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (router.state.location.pathname === "/onboarding") return;
    if (!hasChosenLicenseGroup()) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [router.state.location.pathname, navigate]);

  useEffect(() => {
    applyTheme();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (getThemeMode() === "system") applyTheme("system");
    };
    media.addEventListener?.("change", onSystem);
    return () => media.removeEventListener?.("change", onSystem);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const pathname = router.state.location.pathname;
  const hideNav =
    pathname === "/onboarding" || pathname === "/prihlaseni" || pathname === "/reset-hesla";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HudBackground />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div className={hideNav ? undefined : "pb-[76px]"}>
          <Outlet />
        </div>
        {!hideNav && <BottomNav />}
      </AuthProvider>
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
