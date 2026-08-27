import { EXAM_QUESTION_COUNT } from "./app-config";
import { groupById, type LicenseGroupId, type LicenseScope } from "./license-group";

export type LicenseType = LicenseScope | LicenseGroupId;

export type ExamResult = {
  passed: boolean;
  correctAnswers: number;
  requiredCorrectAnswers: number;
  totalQuestions: number;
  percentage: number;
};

/** Obecné oprávnění 26/30, rozšířené 28/30. */
export const PASS_THRESHOLD: Record<LicenseScope, number> = {
  obecne: 26,
  rozsirene: 28,
};

export function scopeOf(licenseType: LicenseType): LicenseScope {
  if (licenseType === "obecne" || licenseType === "rozsirene") return licenseType;
  return groupById(licenseType).scope;
}

export function requiredCorrect(licenseType: LicenseType): number {
  return PASS_THRESHOLD[scopeOf(licenseType)];
}

/** Jediné místo, kde se ostrý test hodnotí. */
export function getExamResult(
  correctAnswers: number,
  licenseType: LicenseType,
  totalQuestions: number = EXAM_QUESTION_COUNT,
): ExamResult {
  const required = requiredCorrect(licenseType);
  return {
    passed: correctAnswers >= required,
    correctAnswers,
    requiredCorrectAnswers: required,
    totalQuestions,
    percentage: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
  };
}
