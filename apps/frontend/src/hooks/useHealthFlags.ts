import { useEffect, useState } from 'react';
import { api } from '../api';

export interface HealthFlag {
  code: string;
  label: string;
  description?: string;
}

// The four seeded condition flags (ref: prototypes/screens/onboarding.html).
// Doubles as the offline / first-paint fallback AND the description source: the
// public GET /api/healthflags returns only { code, label }, so notes are merged
// back in by code. Scales automatically if the endpoint returns more codes.
export const FALLBACK_FLAGS: HealthFlag[] = [
  { code: 'DM', label: 'Diabetes', description: 'High-sugar preparations get flagged' },
  { code: 'OW', label: 'Overweight / Obesity', description: 'Calorie-dense dishes get a caution' },
  { code: 'LI', label: 'Lactose intolerance', description: 'Dairy — milk, ghee, curd — gets flagged' },
  { code: 'SD', label: 'Sedentary lifestyle', description: 'Rich fat/sugar dishes get portion notes' },
];

/** The condition flags shown in the onboarding + Settings health grid. */
export function useHealthFlags(): HealthFlag[] {
  const [flags, setFlags] = useState<HealthFlag[]>(FALLBACK_FLAGS);

  useEffect(() => {
    let alive = true;
    api.get<HealthFlag[]>('/api/healthflags')
      .then(r => {
        if (!alive || !Array.isArray(r.data) || !r.data.length) return;
        const notes = new Map(FALLBACK_FLAGS.map(f => [f.code, f.description]));
        setFlags(r.data.map(f => ({ ...f, description: f.description ?? notes.get(f.code) })));
      })
      .catch(() => { /* offline / endpoint down — fallback list stands */ });
    return () => { alive = false; };
  }, []);

  return flags;
}
