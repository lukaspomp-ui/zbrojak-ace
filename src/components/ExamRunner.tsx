import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Flag, LayoutGrid, Timer, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { AnswerReview } from "./AnswerReview";
import { RangeCountdown } from "./RangeCountdown";
import { ReportModal } from "./ReportModal";
import { ZoomableImage } from "./ZoomableImage";
import { cn } from "@/lib/utils";
import { EXAM_DURATION_SECONDS } from "@/lib/app-config";
import { useLicenseGroup } from "@/lib/license-group";
import { saveExamAttempt } from "@/lib/exam-history";
import { recordAccuracy } from "@/lib/accuracy";
import { EXAM_FAIL_LINE, EXAM_PASS_LINE } from "@/lib/copy";
import { getExamResult } from "@/lib/exam-scoring";
import {
  consumeExamAttempt,
  recordAnswer,
  SUBJECTS,
  type AnswerKey,
  type Progress,
  type Question,
} from "@/lib/data";

/** Výsledek jednoho ostrého testu. */
export type ExamSummary = {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  durationSeconds: number;
  timedOut: boolean;
};

type Answers = Record<number, AnswerKey>;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Ostrý test — a "blind" exam: no correct/incorrect feedback during the test,
 * free movement between questions (back/forward + sidebar navigator), and a
 * result broken down per knowledge section (okruh). Answers are written to
 * Supabase (spaced repetition) only on submit.
 */
export function ExamRunner({
  questions,
  userId,
  progress,
  title = "Ostrý test",
}: {
  questions: Question[];
  userId: string;
  progress: Progress[];
  title?: string;
}) {
  const queryClient = useQueryClient();
  const { group } = useLicenseGroup();
  const passCorrect = group.passCorrect;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [summary, setSummary] = useState<ExamSummary | null>(null);
  /** Skutečný start testu (po povelovém odpočtu). */
  const startedAt = useRef<number | null>(null);

  const [navOpen, setNavOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  /** Povelový odpočet — jen vizuální předehra, logika testu se nemění. */
  const [counting, setCounting] = useState(true);
  const submitting = useRef(false);

  const total = questions.length;
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  const finish = useCallback(
    async (timedOut = false) => {
    if (submitting.current) return;
    submitting.current = true;
    const progressMap = new Map(progress.map((p) => [p.question_id, p]));
    const nameById = new Map(SUBJECTS.map((s) => [s.id, s.name]));
    const secMap = new Map<string, { name: string; correct: number; total: number }>();
    let correct = 0;
    for (const q of questions) {
      const chosen = answers[q.id];
      const wasCorrect = !!chosen && !!q.answers.find((a) => a.id === chosen)?.is_correct;
      if (wasCorrect) correct++;
      void recordAccuracy(q.subject_id, wasCorrect).catch(() => {});
      const entry = secMap.get(q.subject_id) ?? {
        name: nameById.get(q.subject_id) ?? "Okruh",
        correct: 0,
        total: 0,
      };
      entry.total++;
      if (wasCorrect) entry.correct++;
      secMap.set(q.subject_id, entry);
      try {
        const next = await recordAnswer(userId, q.id, wasCorrect, progressMap.get(q.id));
        progressMap.set(q.id, next);
      } catch {
        /* progress is best-effort; never block submission */
      }
    }
    const total = questions.length;
    const answeredIds = Object.keys(answers).length;
    const durationSeconds = startedAt.current
      ? Math.round((Date.now() - startedAt.current) / 1000)
      : EXAM_DURATION_SECONDS - secondsLeft;
    const examSummary: ExamSummary = {
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: total - correct - (total - answeredIds),
      unanswered: total - answeredIds,
      durationSeconds,
      timedOut,
    };
    setSummary(examSummary);
    try {
      // Free limit se spotřebuje až po dokončení testu (server-side).
      await consumeExamAttempt();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      /* nikdy neblokuj vyhodnocení testu */
    }
    try {
      // Historie testů patří k účtu, ne k zařízení.
      await saveExamAttempt(userId, {
        date: new Date().toISOString(),
        correct,
        total,
        passed: getExamResult(correct, group.id, total).passed,
        sections: SUBJECTS.map((s) => secMap.get(s.id)).filter(
          (x): x is { name: string; correct: number; total: number } => !!x,
        ),
        questionIds: questions.map((q) => q.id),
        answers,
      });
      queryClient.invalidateQueries({ queryKey: ["exam-history"] });
    } catch {
      /* historie je best-effort; nikdy neblokuj vyhodnocení testu */
    }
    queryClient.invalidateQueries({ queryKey: ["progress"] });
    queryClient.invalidateQueries({ queryKey: ["accuracy"] });
    setFinished(true);
    },
    [answers, questions, userId, progress, queryClient, group.id, secondsLeft],
  );

  // Timer — tick only; auto-submit is handled in a separate effect.
  useEffect(() => {
    if (finished || counting) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished, counting]);

  // Čas vypršel → automatické odevzdání testu.
  useEffect(() => {
    if (finished || counting || secondsLeft > 0) return;
    setTimeExpired(true);
    void finish(true);
  }, [secondsLeft, finished, counting, finish]);


  function requestSubmit() {
    setNavOpen(false);
    if (answeredCount < total) setConfirmSubmit(true);
    else void finish();
  }

  if (counting) {
    return (
      <RangeCountdown
        onDone={() => {
          startedAt.current = Date.now();
          setCounting(false);
        }}
      />
    );
  }

  if (finished) {
    return (
      <ExamResult
        questions={questions}
        answers={answers}
        timeExpired={timeExpired}
        summary={summary}
      />
    );
  }

  if (!question) {
    return (
      <main className="mx-auto w-full max-w-md px-5 pt-6">
        <div className="card-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pro ostrý test nejsou k dispozici žádné otázky.
          </p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline">Zpět na přehled</Button>
          </Link>
        </div>
      </main>
    );
  }

  const navigator = (
    <Navigator
      questions={questions}
      answers={answers}
      index={index}
      answeredCount={answeredCount}
      total={total}
      onJump={(i) => {
        setIndex(i);
        setNavOpen(false);
      }}
      onSubmit={requestSubmit}
    />
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-6 safe-bottom">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="card-surface rounded-full p-2.5 text-muted-foreground"
          aria-label="Zpět"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {title} · Skupina {group.id}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            Otázka {index + 1} / {total} · k úspěchu {passCorrect}/30
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
            secondsLeft < 60 ? "bg-destructive/20 text-destructive" : "tint-primary",
          )}
        >
          <Timer className="h-4 w-4" />
          {formatTime(secondsLeft)}
        </span>
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="card-surface rounded-full p-2.5 text-muted-foreground md:hidden"
          aria-label="Přehled otázek"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </header>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-elevated">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="mt-4 flex gap-6">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              <div className="card-surface p-5">
                <h1 className="text-[17px] font-semibold leading-snug">{question.text}</h1>
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
                  const isPicked = answers[question.id] === answer.id;
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: answer.id,
                        }))
                      }
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4 text-left text-[15px] transition-colors active:scale-[0.99]",
                        isPicked
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                          isPicked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {isPicked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="leading-snug">{answer.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setReporting(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Nahlásit chybu
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Předchozí
                  </Button>
                  {index + 1 < total ? (
                    <Button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
                      Další
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={requestSubmit}>Odevzdat test</Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Persistent sidebar navigator (desktop) */}
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-6">{navigator}</div>
        </aside>
      </div>

      {/* Sidebar navigator as a drawer (mobile) */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-background/70 md:hidden"
            onClick={() => setNavOpen(false)}
          >
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="h-full w-72 max-w-[85%] overflow-y-auto bg-background p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Přehled otázek</p>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Zavřít"
                  className="rounded-full bg-card p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {navigator}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {confirmSubmit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          onClick={() => setConfirmSubmit(false)}
        >
          <div
            className="card-surface w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Odevzdat test?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Máš {total - answeredCount} nezodpovězených otázek. Počítají se jako chybné.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                full
                onClick={() => {
                  setConfirmSubmit(false);
                  void finish();
                }}
              >
                Odevzdat
              </Button>
              <Button variant="outline" full onClick={() => setConfirmSubmit(false)}>
                Zpět k testu
              </Button>
            </div>
          </div>
        </div>
      )}

      {reporting && (
        <ReportModal userId={userId} questionId={question.id} onClose={() => setReporting(false)} />
      )}
    </main>
  );
}

function Navigator({
  questions,
  answers,
  index,
  answeredCount,
  total,
  onJump,
  onSubmit,
}: {
  questions: Question[];
  answers: Answers;
  index: number;
  answeredCount: number;
  total: number;
  onJump: (i: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="card-surface p-4">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">
        Zodpovězeno {answeredCount} / {total}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          const current = i === index;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Otázka ${i + 1}`}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors",
                current
                  ? "bg-primary text-primary-foreground"
                  : answered
                    ? "tint-primary"
                    : "border border-border bg-card text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <Button full className="mt-4" onClick={onSubmit}>
        Odevzdat test
      </Button>
    </div>
  );
}

type SectionResult = { name: string; correct: number; total: number };

function ExamResult({
  questions,
  answers,
  timeExpired,
  summary,
}: {
  questions: Question[];
  answers: Answers;
  timeExpired?: boolean;
  summary?: ExamSummary | null;
}) {
  const total = questions.length;
  const nameById = new Map(SUBJECTS.map((s) => [s.id, s.name]));
  const bySubject = new Map<string, SectionResult>();
  let correct = 0;

  for (const q of questions) {
    const chosen = answers[q.id];
    const ok = !!chosen && !!q.answers.find((a) => a.id === chosen)?.is_correct;
    if (ok) correct++;
    const entry =
      bySubject.get(q.subject_id) ??
      ({ name: nameById.get(q.subject_id) ?? "Okruh", correct: 0, total: 0 } as SectionResult);
    entry.total++;
    if (ok) entry.correct++;
    bySubject.set(q.subject_id, entry);
  }

  const { group } = useLicenseGroup();
  const result = getExamResult(correct, group.id, total);
  const percent = result.percentage;
  const passCorrect = result.requiredCorrectAnswers;
  const passed = result.passed;
  const sections = SUBJECTS.map((s) => bySubject.get(s.id)).filter((x): x is SectionResult => !!x);

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6 safe-bottom">
      {timeExpired && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive">
          <Timer className="h-4 w-4 shrink-0" />
          Čas vypršel. Test byl automaticky odevzdán.
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-surface flex flex-col items-center gap-4 p-7 text-center"
      >
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            passed ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
          )}
        >
          {passed ? <Trophy className="h-8 w-8" /> : <X className="h-8 w-8" />}
        </span>
        <div>
          <h1 className="text-xl font-extrabold">{passed ? EXAM_PASS_LINE : EXAM_FAIL_LINE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Správně {correct} z {total} otázek ({percent} %) · k úspěchu je potřeba {passCorrect} z{" "}
            {total} bodů
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Hodnoceno pro {group.scope === "obecne" ? "obecné" : "rozšířené"} oprávnění (skupina{" "}
            {group.id})
          </p>
          {summary && (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Nezodpovězeno {summary.unanswered} · čas{" "}
              {Math.floor(summary.durationSeconds / 60)}:
              {String(summary.durationSeconds % 60).padStart(2, "0")}
            </p>
          )}
        </div>
      </motion.div>

      <div className="card-surface mt-4 p-5">
        <h2 className="text-sm font-semibold">Výsledek po okruzích</h2>
        <div className="mt-3 flex flex-col gap-3">
          {sections.map((s) => {
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="min-w-0 truncate pr-2">{s.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.correct}/{s.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-surface mt-4 p-5">
        <h2 className="text-sm font-semibold">Přehled odpovědí</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Zelená = správná odpověď, červená = tvoje chyba.
        </p>
        <div className="mt-4">
          <AnswerReview questions={questions} answers={answers} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Link to="/">
          <Button full>Zpět na přehled</Button>
        </Link>
        <Link to="/kviz" search={{ mode: "exam" }}>
          <Button variant="outline" full>
            Nový test
          </Button>
        </Link>
        <Link to="/kviz" search={{ mode: "mistakes" }}>
          <Button variant="outline" full>
            Procvičit mé chyby
          </Button>
        </Link>
      </div>
    </main>
  );
}
