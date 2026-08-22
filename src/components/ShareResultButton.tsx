import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./Button";

/** Nakreslí terč se zásahy do canvasu a vrátí PNG blob. */
async function renderCard({
  correct,
  total,
  headline,
}: {
  correct: number;
  total: number;
  headline: string;
}): Promise<Blob | null> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return null;

  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#101015");
  bg.addColorStop(1, "#0a0a0d");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // terč
  const cx = W / 2;
  const cy = 520;
  const rings = [300, 245, 190, 135, 80, 34];
  rings.forEach((r, i) => {
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.strokeStyle = i === rings.length - 1 ? "#ff7d1a" : "rgba(255,255,255,0.22)";
    c.lineWidth = i === rings.length - 1 ? 6 : 3;
    c.stroke();
  });
  c.beginPath();
  c.arc(cx, cy, 14, 0, Math.PI * 2);
  c.fillStyle = "#ff7d1a";
  c.fill();

  // zásahy
  for (let i = 0; i < correct; i++) {
    const angle = (i / Math.max(1, correct)) * Math.PI * 2 + 0.6;
    const radius = 40 + ((i * 37) % 240);
    c.beginPath();
    c.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 11, 0, Math.PI * 2);
    c.fillStyle = "#e3b667";
    c.fill();
  }

  c.textAlign = "center";
  c.fillStyle = "#ff7d1a";
  c.font = "700 34px 'Plus Jakarta Sans', sans-serif";
  c.fillText("ZBROJÁK 2026", cx, 120);

  c.fillStyle = "#ffffff";
  c.font = "800 76px 'Plus Jakarta Sans', sans-serif";
  c.fillText(`Sestřelil jsem ${correct}/${total}`, cx, 920);

  c.fillStyle = "#e3b667";
  c.font = "600 40px 'Plus Jakarta Sans', sans-serif";
  c.fillText(headline, cx, 985);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function ShareResultButton({
  correct,
  total,
  headline,
}: {
  correct: number;
  total: number;
  headline: string;
}) {
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    const text = `Sestřelil jsem ${correct}/${total} — ${headline} · Zbroják 2026`;
    try {
      const blob = await renderCard({ correct, total, headline });
      const file =
        blob && typeof File !== "undefined"
          ? new File([blob], "zbrojak-vysledek.png", { type: "image/png" })
          : null;
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (file && nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text });
      } else if (nav.share) {
        await nav.share({ text });
      } else if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "zbrojak-vysledek.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Kartička s výsledkem uložena.");
      }
    } catch {
      /* sdílení zrušeno uživatelem — nic neděláme */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" full onClick={share} disabled={busy}>
      <Share2 className="h-4 w-4 text-brass" />
      Sdílet výsledek
    </Button>
  );
}
