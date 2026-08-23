// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — plug cross-cutting features in/out from one place.
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURES = {
  /**
   * Fit badge on recipe cards (Safe / Caution / Avoid), derived from a recipe's
   * `healthFlags` (see `deriveFit` in api/recipes.ts).
   *
   * Gated deliberately: the badge is only as good as the health-flag data an
   * admin enters per recipe. Flip this to `false` to remove the badge app-wide
   * (cards fall back to no health mark) until that admin pipeline is confirmed.
   *
   * Even while `true`, the badge renders ONLY for recipes that actually carry
   * flag data — `deriveFit` returns `null` for an unassessed recipe, so we never
   * show a false "Safe". So a recipe shows a badge when: this flag is on AND the
   * admin has entered ≥1 healthFlag for it.
   */
  fitBadge: true,
} as const;
