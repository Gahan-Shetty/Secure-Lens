// Calculates a 0–100 security score from an array of Result documents.
// Starts at 100 and deducts points per finding based on severity.

const DEDUCTIONS = {
  critical: 25,
  high:     15,
  medium:    8,
  low:       3,
  info:      0,
};

module.exports = function scoreEngine(results) {
  let score = 100;
  for (const result of results) {
    score -= DEDUCTIONS[result.severity] || 0;
  }
  return Math.max(0, Math.round(score));
};
