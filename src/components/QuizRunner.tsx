import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Flag,
  RotateCcw,
  Star,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { BullseyeStamp, BulletHole } from "./HitFeedback";
import { ReportModal } from "./ReportModal";
import { ZoomableImage } from "./ZoomableImage";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { EXAM_DURATION_SECONDS } from "@/lib/app-config";
import { useLicenseGroup } from "@/lib/license-group";
import { hitLabel, missLabel } from "@/lib/copy";
import { playClick, playHit, playMiss } from "@/lib/sound";
import { recordAccuracy } from "@/lib/accuracy";
import { recordAnswer, type AnswerKey, type Progress, type Question } from "@/lib/data";

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
  mistakesMode,
}: {
  questions: Question[];
  mode: QuizMode;
  title: string;
  userId: string;
  progress: Progress[];
  onNextRound?: () => void;
  /** Rendered inside the subject tabs, where the screen already has a header. */
  embedded?: boolean;
  /** Hides the redundant "Procvičit mé chyby" button when already in mistakes mode. */
  mistakesMode?: boolean;
}) {
  const queryClient = useQueryClient();
  const { group } = useLicenseGroup();
  const examPassCorrect = group.passCorrect;
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<AnswerKey | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  /** Playful practice-mode feedback (cosmetic only). */
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [feedbackLabel, setFeedbackLabel] = useState("");
  const [hitStreak, setHitStreak] = useState(0);
  const hitTotal = useRef(0);
  const missTotal = useRef(0);

  const progressMap = useRef(new Map(progress.map((p) => [p.question_id, p]))).current;

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
  const passed = useMemo(() => total > 0 && correctCount >= examPassCorrect, [correctCount, total]);

  async function pick(answerId: AnswerKey) {
    if (selectedId || !question) return;
    setSelectedId(answerId);
    playClick();
    const answer = question.answers.find((a) => a.id === answerId);
    const wasCorrect = !!answer?.is_correct;
    if (wasCorrect) setCorrectCount((c) => c + 1);
    // Cosmetic feedback — practice mode only, the exam stays blind.
    setWasCorrect(wasCorrect);
    void recordAccuracy(question.subject_id, wasCorrect).catch(() => {});
    if (wasCorrect) {
      setFeedbackLabel(hitLabel(hitTotal.current++));
      setHitStreak((s) => s + 1);
      playHit();
    } else {
      setFeedbackLabel(missLabel(missTotal.current++));
      setHitStreak(0);
      playMiss();
    }
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
    setWasCorrect(null);
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
        mistakesMode={mistakesMode}
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
            className="card-surface rounded-full p-2.5 text-muted-foreground"
            aria-label="Zpět"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {!embedded && <p className="truncate text-sm font-semibold">{title}</p>}
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
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[17px] font-semibold leading-snug">{question.text}</h1>
              <button
                type="button"
                onClick={() => toggleFavorite(question.id)}
                aria-label="Oblíbená otázka"
                className="shrink-0"
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    isFavorite(question.id) ? "fill-current text-brass" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>
            {question.images.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {question.images.map((src) => (
                  <ZoomableImage key={src} src={src} alt={question.text} />
                ))}
              </div>
            )}
          </div>

          <div className={cn("flex flex-col gap-2.5", wasCorrect === false && "animate-recoil")}>
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
                    showCorrect && "border-success bg-success/15 text-foreground",
                    showWrong && "border-destructive bg-destructive/15",
                    !reveal && "active:scale-[0.99]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px]",
                      showCorrect && "border-success bg-success text-success-foreground",
                      showWrong && "border-destructive bg-destructive text-destructive-foreground",
                    )}
                  >
                    {showCorrect && <Check className="h-3 w-3" />}
                    {showWrong && <X className="h-3 w-3" />}
                  </span>
                  <span className="leading-snug">{answer.text}</span>
                  {showCorrect && (
                    <span className="animate-stamp relative ml-auto flex shrink-0 items-center gap-1.5 text-success">
                      <BullseyeStamp className="h-6 w-6" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wide">
                        {isPicked ? feedbackLabel : "Správně"}
                      </span>
                      {isPicked && (
                        <span className="animate-ten num absolute -top-4 right-0 text-sm font-extrabold text-success">
                          10
                        </span>
                      )}
                    </span>
                  )}
                  {showWrong && (
                    <span className="animate-stamp ml-auto flex shrink-0 items-center gap-1.5 text-destructive">
                      <BulletHole className="h-7 w-7" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wide">
                        {feedbackLabel}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedId && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-surface p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                Proč je to správně
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {question.explanation}
              </p>
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

      <AnimatePresence>
        {hitStreak >= 3 && selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="tint-brass pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto w-fit rounded-full px-4 py-2 text-xs font-extrabold"
          >
            Sériová palba! {hitStreak} zásahů v řadě
          </motion.div>
        )}
      </AnimatePresence>

      {reporting && (
        <ReportModal userId={userId} questionId={question.id} onClose={() => setReporting(false)} />
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
  mistakesMode,
}: {
  mode: QuizMode;
  correct: number;
  total: number;
  passed: boolean;
  onNextRound?: () => void;
  mistakesMode?: boolean;
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
        {mode === "exam" && !passed ? <X className="h-8 w-8" /> : <Trophy className="h-8 w-8" />}
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
