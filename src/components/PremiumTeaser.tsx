import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { Button } from "./Button";

/** Small inline paywall used by the study screens (same rules as elsewhere). */
export function PremiumTeaser({
  title = "Tato část je v Premium",
  text,
}: {
  title?: string;
  text: string;
}) {
  return (
    <div className="card-surface p-5 text-center">
      <span className="tint-primary mx-auto flex h-10 w-10 items-center justify-center rounded-xl">
        <Crown className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {text}
      </p>
      <Link to="/premium" className="mt-4 block">
        <Button full>Zobrazit Premium</Button>
      </Link>
    </div>
  );
}
