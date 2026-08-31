import { useMemo, useRef, useState } from "react";
import { Loading } from "./Loading";
import { QuizRunner } from "./QuizRunner";
import { PremiumTeaser } from "./PremiumTeaser";
import { useAuth } from "@/hooks/use-auth";
import { useProfileQuery, useProgressQuery, useQuestionsQuery } from "@/hooks/use-exam-data";
import { PRACTICE_ROUND_SIZE } from "@/lib/app-config";
import { buildPracticeRound } from "@/lib/smart-repetition";
import { availableQuestions, type Question } from "@/lib/data";

/**
 * The existing 5-random-question practice round, unchanged in behaviour,
 * reusable inside the subject tabs.
 */
export function PracticeRound({ subjectId, title }: { subjectId: string; title: string }) {
  const { ready, userId } = useAuth();
  const { data: questions } = useQuestionsQuery();
  const { data: profile } = useProfileQuery();
  const { data: progress } = useProgressQuery();

  const isPremium = profile?.is_premium === true;
  const [round, setRound] = useState(0);
  const lastRoundIds = useRef<number[]>([]);

  const set = useMemo<Question[] | null>(() => {
    if (!questions || !progress) return null;
    const pool = availableQuestions(questions, isPremium).filter((q) => q.subject_id === subjectId);
    if (pool.length <= PRACTICE_ROUND_SIZE) return shuffle(pool);
    const previous = lastRoundIds.current;
    const fresh = pool.filter((q) => !previous.includes(q.id));
    const picked = shuffle(fresh).slice(0, PRACTICE_ROUND_SIZE);
    if (picked.length < PRACTICE_ROUND_SIZE) {
      const filler = shuffle(pool.filter((q) => !picked.some((p) => p.id === q.id))).slice(
        0,
        PRACTICE_ROUND_SIZE - picked.length,
      );
      picked.push(...filler);
    }
    lastRoundIds.current = picked.map((q) => q.id);
    return shuffle(picked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, progress, isPremium, subjectId, round]);

  if (!ready || !userId || !set || !progress) {
    return <Loading full={false} line="Nabíjím otázky…" />;
  }

  if (set.length === 0) {
    return (
      <PremiumTeaser
        title="Žádné otázky v tomto okruhu"
        text="Ve free verzi je dostupná jen část databáze. Premium odemkne všechny otázky."
      />
    );
  }

  return (
    <QuizRunner
      key={`${subjectId}-${round}`}
      questions={set}
      mode="practice"
      title={title}
      userId={userId}
      progress={progress}
      onNextRound={() => setRound((r) => r + 1)}
      embedded
    />
  );
}
