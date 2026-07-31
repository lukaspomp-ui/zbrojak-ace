import { motion } from "framer-motion";
import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./Button";
import { reportQuestion } from "@/lib/data";

export function ReportModal({
  userId,
  questionId,
  onClose,
}: {
  userId: string;
  questionId: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await reportQuestion(userId, questionId, message.trim());
      toast.success("Díky! Chybu jsme zaznamenali.");
      onClose();
    } catch {
      toast.error("Nahlášení se nepovedlo. Zkus to prosím znovu.");
    } finally {
      setSending(false);
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
        <div className="mb-1 flex items-center gap-2">
          <Flag className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Nahlásit chybu</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Popiš, co je v otázce špatně. Díky tobě ji opravíme.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Např. špatná odpověď, neplatný paragraf, překlep…"
          className="w-full resize-none rounded-xl border border-input bg-elevated p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <div className="mt-4 flex gap-2">
          <Button variant="outline" full onClick={onClose}>
            Zrušit
          </Button>
          <Button full onClick={submit} disabled={sending || !message.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Odeslat
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
