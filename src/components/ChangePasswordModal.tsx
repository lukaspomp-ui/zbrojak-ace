import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./Button";
import { supabase } from "@/integrations/supabase/client";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = again.length > 0 && password !== again;
  const valid = password.length >= 6 && password === again;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Heslo bylo změněno.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Heslo se nepovedlo změnit. Zkus to znovu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="card-surface w-full max-w-md p-5 safe-bottom sm:pb-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Změnit heslo</h2>
        </div>

        <label className="text-xs font-semibold text-muted-foreground">Nové heslo</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-3 mt-1 w-full rounded-xl border border-input bg-elevated p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <label className="text-xs font-semibold text-muted-foreground">Nové heslo znovu</label>
        <input
          type="password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-xl border border-input bg-elevated p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {mismatch && (
          <p className="mt-2 text-xs font-medium text-destructive">Hesla se neshodují.</p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" full onClick={onClose}>
            Zrušit
          </Button>
          <Button full onClick={submit} disabled={busy || !valid}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Změnit heslo
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
