// Ingredient-rule engine: derive a recipe's health-flags from its ingredients.
// See docs/specs/2026-09-03-admin-outcomes.md (Diet Rules).

export interface RuleEffect { condition: string; severity: 'caution' | 'avoid' | 'indication' }
export interface Rule { ingredient: string; match: string[]; effects: RuleEffect[]; enabled?: boolean }
export interface Flag { condition: string; severity: string; note: string; source?: 'rule' | 'manual' }

const CONTRA_RANK: Record<string, number> = { avoid: 3, caution: 2 };

/** True if any of the recipe's ingredient names contains any of the rule's keywords. */
export function ruleMatches(rule: Rule, ingredientNames: string[]): boolean {
  if (rule.enabled === false) return false;
  return rule.match.some(kw => kw && ingredientNames.some(n => n.includes(kw)));
}

/**
 * Rule-derived flags for one recipe. Per condition, the strongest contraindication
 * wins (avoid > caution); an 'indication' applies only when no contraindication does
 * (safety first). Rules never emit 'safe'.
 */
export function deriveFlags(ingredients: { nameEn?: string }[], rules: Rule[]): Flag[] {
  const names = ingredients.map(i => (i.nameEn ?? '').toLowerCase()).filter(Boolean);
  const byCond = new Map<string, { contra?: string; indication?: boolean }>();

  for (const rule of rules) {
    if (!ruleMatches(rule, names)) continue;
    for (const eff of rule.effects) {
      const cur = byCond.get(eff.condition) ?? {};
      if (eff.severity === 'indication') {
        cur.indication = true;
      } else if (!cur.contra || CONTRA_RANK[eff.severity] > CONTRA_RANK[cur.contra]) {
        cur.contra = eff.severity;
      }
      byCond.set(eff.condition, cur);
    }
  }

  const out: Flag[] = [];
  for (const [condition, v] of byCond) {
    const severity = v.contra ?? (v.indication ? 'indication' : null);
    if (severity) out.push({ condition, severity, note: '', source: 'rule' });
  }
  return out;
}

/**
 * Merge rule-derived flags into a recipe's existing flags. Manual flags (source
 * !== 'rule', which includes legacy flags with no source) are preserved and win
 * their condition — they are the admin's overrides. Only 'rule' flags are
 * replaced. Idempotent: re-running with the same rules yields no changes.
 */
export function mergeFlags(existing: Flag[], derived: Flag[]) {
  // manual + legacy overrides; normalise legacy (no source) to 'manual'
  const kept = existing
    .filter(f => f.source !== 'rule')
    .map(f => ({ ...f, source: 'manual' as const }));
  const manualConds = new Set(kept.map(f => f.condition));
  const freshDerived = derived.filter(d => !manualConds.has(d.condition));
  const next = [...kept, ...freshDerived];

  const prevRule = new Map(existing.filter(f => f.source === 'rule').map(f => [f.condition, f.severity]));
  const nextRule = new Map(freshDerived.map(f => [f.condition, f.severity]));

  let added = 0, changed = 0, removed = 0;
  for (const [c, s] of nextRule) {
    if (!prevRule.has(c)) added++;
    else if (prevRule.get(c) !== s) changed++;
  }
  for (const c of prevRule.keys()) if (!nextRule.has(c)) removed++;

  const dirty = added > 0 || changed > 0 || removed > 0;
  return { next, added, changed, removed, overrides: kept.length, dirty };
}
