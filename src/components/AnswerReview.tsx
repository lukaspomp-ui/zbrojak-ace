import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZoomableImage } from "./ZoomableImage";
import type { AnswerKey, Question } from "@/lib/data";

/**
 * Per-question review used both on the exam result screen and in test history.
 * Green = correct answer, red = the answer the user picked wrongly.
 * The user's selected answer is explicitly marked with a "Tvá odpověď" badge.
 */
export function AnswerReview({
  questions,
  answers,
}: {
  questions: Question[];
  answers: Record<number, AnswerKey>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => {
        const chosen = answers[q.id];
        const correctId = q.answers.find((a) => a.is_correct)?.id;
        const answered = chosen !== undefined;
        const ok = answered && chosen === correctId;
        return (
          <div
            key={q.id}
            className="border-t border-border pt-4 first:border-0 first:pt-0"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Otázka {i + 1}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  ok
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive",
                )}
              >
                {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {ok ? "Správně" : answered ? "Špatně" : "Nezodpovězeno"}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug">{q.text}</p>
            {q.images.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {q.images.map((src) => (
                  <ZoomableImage key={src} src={src} alt={q.text} />
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-col gap-1.5">
              {q.answers.map((a) => {
                const isChosenWrong = a.id === chosen && !a.is_correct;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] leading-snug",
                      a.is_correct
                        ? "border-success bg-success/15"
                        : isChosenWrong
                          ? "border-destructive bg-destructive/15"
                          : "border-border",
                    )}
                  >
                    {a.is_correct ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    ) : isChosenWrong ? (
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    ) : (
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{a.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
