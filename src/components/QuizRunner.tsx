import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Flag,
  RotateCcw,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { ReportModal } from "./ReportModal";
import { ZoomableImage } from "./ZoomableImage";
import { cn } from "@/lib/utils";
import { EXAM_DURATION_SECONDS, EXAM_PASS_CORRECT } from "@/lib/app-config";
import {
  recordAnswer,
  type AnswerKey,
  type Progress,
  type Question,
} from "@/lib/data";

export type QuizMode = "practice" | "exam";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizRunner({
  questions,
  mode,
  title,
  userId,
  progress,
  onNextRound,
  embedded,
}: {
  questions: Question[];
  mode: QuizMode;
  title: string;
  userId: string;
  progress: Progress[];
  onNextRound?: () => void;
  /** Rendered inside the subject tabs, where the screen already has a header. */
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<AnswerKey | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);

  const progressMap = useRef(
    new Map(progress.map((p) => [p.question_id, p])),
  ).current;

  useEffect(() => {
    if (mode !== "exam" || finished) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, finished]);

  useEffect(() => {
    if (finished) {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    }
  }, [finished, queryClient]);

  const question = questions[index];
  const total = questions.length;
  const passed = useMemo(
    () => total > 0 && correctCount >= EXAM_PASS_CORRECT,
    [correctCount, total],
  );

  async function pick(answerId: AnswerKey) {
    if (selectedId || !question) return;
    setSelectedId(answerId);
    const answer = question.answers.find((a) => a.id === answerId);
    const wasCorrect = !!answer?.is_correct;
    if (wasCorrect) setCorrectCount((c) => c + 1);
    if (!wasCorrect) setExplanationOpen(true);
    try {
      const next = await recordAnswer(
        userId,
        question.id,
        wasCorrect,
        progressMap.get(question.id),
      );
      progressMap.set(question.id, next);
    } catch {
      /* progress is best-effort; never block the quiz */
    }
  }

  function next() {
    setSelectedId(null);
    setExplanationOpen(false);
    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <ResultCard
        mode={mode}
        correct={correctCount}
        total={total}
        passed={passed}
        onNextRound={onNextRound}
      />
    );
  }

  if (!question) {
    return (
      <div className="card-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Pro tento režim nejsou k dispozici žádné otázky.
        </p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline">Zpět na přehled</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        {!embedded && (
          <Link
            to="/"
            className="rounded-full bg-card p-2.5 text-muted-foreground"
            aria-label="Zpět"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {!embedded && (
            <p className="truncate text-sm font-semibold">{title}</p>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            {index + 1} / {total}
          </p>
        </div>
        {mode === "exam" && (
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
              secondsLeft < 60 ? "bg-destructive/20 text-destructive" : "tint-primary",
            )}
          >
            <Timer className="h-4 w-4" />
            {formatTime(secondsLeft)}
          </span>
        )}
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <div className="card-surface p-5">
            <h1 className="text-[17px] font-semibold leading-snug">
              {question.text}
            </h1>
            {question.images.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {question.images.map((src) => (
                  <ZoomableImage key={src} src={src} alt={question.text} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {question.answers.map((answer) => {
              const isPicked = selectedId === answer.id;
              const reveal = !!selectedId;
              const showCorrect = reveal && answer.is_correct;
              const showWrong = reveal && isPicked && !answer.is_correct;
              return (
                <button
                  key={answer.id}
                  type="button"
                  onClick={() => pick(answer.id)}
                  disabled={reveal}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 text-left text-[15px] transition-colors",
                    "border-border bg-card",
                    showCorrect &&
                      "border-success bg-success/15 text-foreground",
                    showWrong && "border-destructive bg-destructive/15",
                    !reveal && "active:scale-[0.99]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px]",
                      showCorrect && "border-success bg-success text-success-foreground",
                      showWrong &&
                        "border-destructive bg-destructive text-destructive-foreground",
                    )}
                  >
                    {showCorrect && <Check className="h-3 w-3" />}
                    {showWrong && <X className="h-3 w-3" />}
                  </span>
                  <span className="leading-snug">{answer.text}</span>
                </button>
              );
            })}
          </div>

          {selectedId && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-surface overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExplanationOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 p-4 text-left text-sm font-semibold"
              >
                Proč je to správně
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    explanationOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {explanationOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24 }}
                  >
                    <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {question.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 pt-1 safe-bottom">
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Flag className="h-3.5 w-3.5" />
          Nahlásit chybu
        </button>
        {selectedId && (
          <Button onClick={next}>
            {index + 1 >= total ? "Dokončit" : "Další otázka"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {reporting && (
        <ReportModal
          userId={userId}
          questionId={question.id}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}

function ResultCard({
  mode,
  correct,
  total,
  passed,
  onNextRound,
}: {
  mode: QuizMode;
  correct: number;
  total: number;
  passed: boolean;
  onNextRound?: () => void;
}) {
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-surface flex flex-col items-center gap-4 p-7 text-center"
    >
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          mode === "exam" && !passed
            ? "bg-destructive/20 text-destructive"
            : "bg-success/20 text-success",
        )}
      >
        {mode === "exam" && !passed ? (
          <X className="h-8 w-8" />
        ) : (
          <Trophy className="h-8 w-8" />
        )}
      </span>
      <div>
        <h1 className="text-xl font-bold">
          {mode === "exam"
            ? passed
              ? "Prospěl jsi!"
              : "Neprospěl jsi"
            : onNextRound
              ? "Kolo dokončeno!"
              : "Procvičeno!"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Správně {correct} z {total} otázek ({percent} %)
          {mode === "exam" ? " · k úspěchu je potřeba 80 %" : ""}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {onNextRound && (
          <Button full onClick={onNextRound}>
            <RotateCcw className="h-4 w-4" />
            Další kolo
          </Button>
        )}
        <Link to="/">
          <Button variant={onNextRound ? "outline" : "primary"} full>
            Zpět na přehled
          </Button>
        </Link>
        <Link to="/kviz" search={{ mode: "mistakes" }}>
          <Button variant="outline" full>
            <RotateCcw className="h-4 w-4" />
            Procvičit mé chyby
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
