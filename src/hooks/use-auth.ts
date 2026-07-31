import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  session: Session | null;
  userId: string | null;
  isGuest: boolean;
  ready: boolean;
};

/**
 * Ensures every visitor has a session: guests get an anonymous one so the
 * free tier works without signing up.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
      const { data: after } = await supabase.auth.getSession();
      if (!active) return;
      setSession(after.session);
      setReady(true);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    userId: session?.user.id ?? null,
    isGuest: session?.user.is_anonymous === true,
    ready,
  };
}
