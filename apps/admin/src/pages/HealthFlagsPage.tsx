import { useState } from 'react';

// Condition codes mirror the api's health-flag condition values; persistence
// lands in the wiring wave — defaults below seed the form until then.
const CONDITIONS = [
  { code: 'DIABETES', label: 'Diabetes', defaultDesc: 'High blood sugar — avoid recipes high in simple carbohydrates.' },
  { code: 'OBESITY', label: 'Obesity', defaultDesc: 'Weight management — prefer low-calorie, high-fibre preparations.' },
  { code: 'LACTOSE_INTOLERANT', label: 'Lactose Intolerant', defaultDesc: 'Dairy intolerance — exclude milk-based ingredients.' },
  { code: 'SEDENTARY', label: 'Sedentary Lifestyle', defaultDesc: 'Low activity — prefer easily digestible, light recipes.' },
  { code: 'PREGNANT', label: 'Pregnancy', defaultDesc: 'Pregnancy — avoid bitter, pungent, or uterine-stimulating foods.' },
  { code: 'LACTATING', label: 'Lactating', defaultDesc: 'Lactation — favour galactagogues; avoid strong spices.' },
  { code: 'NUT_ALLERGY', label: 'Nut Allergy', defaultDesc: 'Tree nut or peanut allergy — exclude all nut-derived ingredients.' },
  { code: 'INFANT_8M', label: 'Infant (8m+)', defaultDesc: 'Complementary feeding — soft textures, no added salt or sugar.' },
];

type FlagState = { label: string; description: string };

export function HealthFlagsPage() {
  const [flags, setFlags] = useState<Record<string, FlagState>>(() =>
    Object.fromEntries(CONDITIONS.map(c => [c.code, { label: c.label, description: c.defaultDesc }]))
  );

  const update = (code: string, patch: Partial<FlagState>) =>
    setFlags(f => ({ ...f, [code]: { ...f[code], ...patch } }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink/55">
          Labels and descriptions shown to users when a recipe is flagged for their health profile.
        </p>
        <button type="button" className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium">
          Save all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CONDITIONS.map(c => (
          <div key={c.code} className="bg-white border border-ink/20 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-3">{c.code}</p>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor={`${c.code}-label`} className="text-xs text-ink/55 mb-1 block">
                  Display label
                </label>
                <input
                  id={`${c.code}-label`}
                  value={flags[c.code].label}
                  onChange={e => update(c.code, { label: e.target.value })}
                  className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
                />
              </div>
              <div>
                <label htmlFor={`${c.code}-desc`} className="text-xs text-ink/55 mb-1 block">
                  Description shown to users
                </label>
                <textarea
                  id={`${c.code}-desc`}
                  rows={2}
                  value={flags[c.code].description}
                  onChange={e => update(c.code, { description: e.target.value })}
                  className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
