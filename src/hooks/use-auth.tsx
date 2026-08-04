import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  session: Session | null;
  userId: string | null;
  isGuest: boolean;
  ready: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  userId: null,
  isGuest: false,
  ready: false,
});

/**
 * Single source of truth for the session. Guests get an anonymous session so
 * the free tier works without signing up.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<AuthState>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      // TEMPORARY (DEV_OPEN): the anonymous session is treated as a full user,
      // so no sign-in prompts appear anywhere.
      isGuest: DEV_OPEN ? false : session?.user.is_anonymous === true,
      ready,
    }),
    [session, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
