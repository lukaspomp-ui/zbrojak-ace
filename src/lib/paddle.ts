/**
 * Paddle.js (Billing v2) — web-only jednorázová platba za Premium.
 *
 * Zde smí být pouze VEŘEJNÉ údaje: client-side token a price ID.
 * API key ani webhook secret se do frontendu nikdy nedostanou — Premium
 * aktivuje výhradně server přes /api/public/paddle-webhook.
 */

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

export const PADDLE_CLIENT_TOKEN: string =
  (import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined) ?? "";

/** Jednorázová cena 99 Kč (one-time price, ne subscription). */
export const PADDLE_PRICE_ID: string =
  (import.meta.env.VITE_PADDLE_PRICE_ID as string | undefined) ??
  "pri_01m1bqd8qnp3kb71y4q3wd3rjb";

/** "sandbox" nebo "production" */
export const PADDLE_ENVIRONMENT: string =
  (import.meta.env.VITE_PADDLE_ENVIRONMENT as string | undefined) ?? "production";

export function isPaddleConfigured(): boolean {
  return PADDLE_CLIENT_TOKEN.length > 0 && PADDLE_PRICE_ID.length > 0;
}

type PaddleEvent = { name?: string; data?: unknown };

type PaddleSdk = {
  Environment?: { set: (env: string) => void };
  Initialize: (opts: {
    token: string;
    environment?: string;
    eventCallback?: (event: PaddleEvent) => void;
  }) => void;
  Checkout: {
    open: (opts: Record<string, unknown>) => void;
    close?: () => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleSdk;
  }
}

let scriptPromise: Promise<PaddleSdk> | null = null;

function loadScript(): Promise<PaddleSdk> {
  if (typeof window === "undefined") return Promise.reject(new Error("Paddle je jen v prohlížeči."));
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<PaddleSdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS}"]`);
    const el = existing ?? document.createElement("script");
    const done = () => {
      if (window.Paddle) resolve(window.Paddle);
      else reject(new Error("Paddle.js se nepodařilo načíst."));
    };
    el.addEventListener("load", done);
    el.addEventListener("error", () => reject(new Error("Paddle.js se nepodařilo načíst.")));
    if (!existing) {
      el.src = PADDLE_JS;
      el.async = true;
      document.head.appendChild(el);
    } else if (window.Paddle) {
      done();
    }
  }).catch((e) => {
    scriptPromise = null;
    throw e;
  });

  return scriptPromise;
}

let initialized = false;

export type CheckoutEvents = {
  /** Platba proběhla v Paddle; Premium ale potvrzuje až webhook. */
  onCompleted?: () => void;
  /** Uživatel checkout zavřel bez zaplacení. */
  onClosed?: () => void;
  onError?: (message: string) => void;
};

/**
 * Otevře Paddle overlay checkout pro jednorázovou platbu.
 * `userId` se posílá v `custom_data`, aby webhook platbu spolehlivě přiřadil.
 */
export async function openPremiumCheckout(opts: {
  userId: string;
  email?: string | null;
  events?: CheckoutEvents;
}): Promise<void> {
  if (!isPaddleConfigured()) {
    throw new Error("Platba není nastavená (chybí Paddle client token nebo price ID).");
  }
  if (!opts.userId) throw new Error("Chybí uživatel — přihlas se prosím znovu.");

  const paddle = await loadScript();

  if (!initialized) {
    paddle.Environment?.set(PADDLE_ENVIRONMENT);
    paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: (event) => {
        const handlers = currentEvents;
        if (!handlers) return;
        switch (event?.name) {
          case "checkout.completed":
            handlers.onCompleted?.();
            break;
          case "checkout.closed":
            handlers.onClosed?.();
            break;
          case "checkout.error":
            handlers.onError?.("Platba se nepovedla. Zkus to prosím znovu.");
            break;
          default:
            break;
        }
      },
    });
    initialized = true;
  }

  currentEvents = opts.events ?? null;

  paddle.Checkout.open({
    settings: {
      displayMode: "overlay",
      theme: "dark",
      locale: "cs",
    },
    items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
    customData: { user_id: opts.userId },
    ...(opts.email ? { customer: { email: opts.email } } : {}),
  });
}

let currentEvents: CheckoutEvents | null = null;
