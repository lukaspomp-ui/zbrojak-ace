import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paddle Billing webhook → aktivace Premium.
 *
 * Public endpoint (Paddle neposílá JWT), proto se volající ověřuje podpisem
 * v hlavičce `Paddle-Signature` pomocí PADDLE_WEBHOOK_SECRET.
 *
 * URL pro Paddle notification destination:
 *   https://<domena>/api/public/paddle-webhook
 */

const PREMIUM_EVENTS = new Set([
  "transaction.completed",
  "transaction.paid",
  "subscription.activated",
  "subscription.created",
]);

const REVOKE_EVENTS = new Set([
  "subscription.canceled",
  "transaction.payment_failed",
  "adjustment.created", // refund / chargeback
]);

function verifySignature(header: string | null, rawBody: string, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(h1, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Najde uživatele z custom_data.user_id, jinak podle e-mailu z Paddle zákazníka. */
async function resolveUserId(
  data: Record<string, unknown>,
  admin: {
    auth: {
      admin: {
        listUsers: (args: { page: number; perPage: number }) => Promise<{
          data: { users: { id: string; email?: string | null }[] };
          error: unknown;
        }>;
      };
    };
  },
): Promise<string | null> {
  const custom = (data["custom_data"] ?? null) as Record<string, unknown> | null;
  const fromCustom = custom?.["user_id"] ?? custom?.["userId"];
  if (typeof fromCustom === "string" && fromCustom.length > 0) return fromCustom;

  const email =
    (data["customer"] as { email?: string } | undefined)?.email ??
    (data["billing_details"] as { email?: string } | undefined)?.email ??
    (typeof data["email"] === "string" ? (data["email"] as string) : undefined);
  if (!email) return null;

  const needle = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (hit) return hit.id;
    if (list.users.length < 200) break;
  }
  return null;
}

export const Route = createFileRoute("/api/public/paddle-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PADDLE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });

        const rawBody = await request.text();
        if (!verifySignature(request.headers.get("paddle-signature"), rawBody, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { event_type?: string; data?: Record<string, unknown> };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventType = payload.event_type ?? "";
        const data = payload.data ?? {};

        const grant = PREMIUM_EVENTS.has(eventType);
        const revoke = !grant && REVOKE_EVENTS.has(eventType);
        // Neznámé eventy potvrdíme, aby je Paddle nezkoušel opakovat.
        if (!grant && !revoke) return new Response("ignored", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const userId = await resolveUserId(
          data,
          supabaseAdmin as unknown as Parameters<typeof resolveUserId>[1],
        );
        if (!userId) {
          console.error("[paddle-webhook] nelze určit uživatele", { eventType });
          // 200, aby Paddle neopakoval — chybu řešíme ručně.
          return new Response("user not resolved", { status: 200 });
        }

        // Service role obchází RLS i ochranný trigger na profiles.is_premium.
        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert(
            { id: userId, is_premium: grant } as never,
            { onConflict: "id" },
          );
        if (error) {
          console.error("[paddle-webhook] zápis profilu selhal", error);
          return new Response("db error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
