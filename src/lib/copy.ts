/** Sportovně-střelecké hlášky a texty (čistě kosmetická vrstva). */

export const HIT_LABELS = ["Desítka!", "Do černého", "Přímý zásah"];
export const MISS_LABELS = ["Vedle", "Mimo terč", "Šupa do plotu"];

export const LOADING_LINES = ["Nabíjím otázky…", "Čistím hlaveň…"];

export const EMPTY_HISTORY = "Zatím jsi nebyl na střelnici — dej si první ostrý test.";

export const EXAM_PASS_LINE = "Terč sejmutý — zbroják máš v kapse.";
export const EXAM_FAIL_LINE = "Ještě pár ran na sucho.";

export function hitLabel(streakIndex: number) {
  return HIT_LABELS[streakIndex % HIT_LABELS.length]!;
}

export function missLabel(missIndex: number) {
  return MISS_LABELS[missIndex % MISS_LABELS.length]!;
}

export function loadingLine(seed = 0) {
  return LOADING_LINES[seed % LOADING_LINES.length]!;
}

/** Verdikt k připravenosti na zkoušku. */
export function readinessVerdict(percent: number) {
  return percent >= 70 ? "Blízko složení" : "Ještě to chce trénink";
}

/** "3 dny na střelnici v kuse" */
export function streakLabel(days: number) {
  const word = days === 1 ? "den" : days >= 2 && days <= 4 ? "dny" : "dní";
  return `${days} ${word} na střelnici v kuse`;
}
