const BASE_POINTS = 1000;
const MAX_TIME_BONUS = 500;

/**
 * Calculate points for an answer.
 * Correct + fast = up to 1500 pts. Wrong = 0.
 */
export function calculatePoints(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0;
  const ratio = Math.max(0, Math.min(1, 1 - timeTakenMs / timeLimitMs));
  return BASE_POINTS + Math.floor(ratio * MAX_TIME_BONUS);
}
