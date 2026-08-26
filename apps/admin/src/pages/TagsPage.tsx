import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Vocab, VocabValue } from '../components/TagRows';

const FACETS = [
  { facet: 'type',       label: 'Type' },
  { facet: 'meal',       label: 'Meal' },
  { facet: 'ingredient', label: 'Main ingredient' },
  { facet: 'method',     label: 'Method' },
  { facet: 'diet',       label: 'Diet' },
] as const;

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mk = (labels: string[]): VocabValue[] =>
  labels.map((label, i) => ({ code: slug(label), label, order: i + 1, enabled: true }));

// Curated starter vocabulary (docs/specs/2026-08-24-discovery-tags.md §1) — shown
// on a fresh DB; the admin edits + Save all to persist, same pattern as Health Flags.
const DEFAULTS: Vocab = {
  type: mk(['Roti', 'Paratha', 'Laddu', 'Halwa', 'Vada', 'Panaka', 'Buttermilk', 'Soup', 'Payasa', 'Porridge', 'Shrikhand', 'Chutney', 'Preserve', 'Rice']),
  meal: mk(['Breakfast', 'Snack', 'Side', 'Drink', 'Dessert']),
  ingredient: mk(['Coconut', 'Barley', 'Amla', 'Black gram', 'Milk', 'Ghee', 'Jaggery', 'Sesame']),
  method: mk(['Steamed', 'Fried', 'Baked', 'Roasted', 'Boiled', 'No-cook', 'Fermented', 'Soaked']),
  diet: mk(['Sweet', 'Savoury', 'No added sugar', 'Dairy', 'High protein']),
};

// Keep any facet the DB has values for; fall back to the curated default per facet.
function mergeDefaults(saved: Partial<Vocab> | null | undefined): Vocab {
  const next: Vocab = { type: [...DEFAULTS.type], meal: [...DEFAULTS.meal], ingredient: [...DEFAULTS.ingredient], method: [...DEFAULTS.method], diet: [...DEFAULTS.diet] };
  for (const { facet } of FACETS) {
    const list = saved?.[facet];
    if (Array.isArray(list) && list.length > 0) next[facet] = list as VocabValue[];
  }
  return next;
}

export function TagsPage() {
  const [vocab, setVocab] = useState<Vocab>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<Partial<Vocab>>('/api/admin/tags')
      .then(saved => setVocab(mergeDefaults(saved)))
      .catch(() => { /* endpoint unreachable — defaults stay */ });
  }, []);

  const setFacet = (facet: keyof Vocab, list: VocabValue[]) =>
    setVocab(v => ({ ...v, [facet]: list }));
  const patchRow = (facet: keyof Vocab, i: number, patch: Partial<VocabValue>) =>
    setFacet(facet, vocab[facet].map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function saveAll() {
    setSaving(true); setMsg(null);
    try {
      const body: Vocab = { ...vocab };
      for (const { facet } of FACETS) {
        body[facet] = vocab[facet]
          .map((t, i) => ({ code: (t.code || slug(t.label)).trim(), label: t.label.trim(), order: t.order ?? i + 1, enabled: t.enabled !== false }))
          .filter(t => t.label && t.code);
      }
      const saved = await api<Partial<Vocab>>('/api/admin/tags', { method: 'PUT', body: JSON.stringify(body) });
      setVocab(mergeDefaults(saved));
      setMsg({ ok: true, text: 'Saved.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink/55">
          The controlled vocabulary behind discovery — chips, filters, and the “Cook with…” tiles.
          Recipes may only carry codes defined here.
        </p>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-xs ${msg.ok ? 'text-brand' : 'text-clay'}`}>{msg.text}</span>}
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        {FACETS.map(({ facet, label }) => (
          <div key={facet} className="bg-white border border-ink/20 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-3">{label}</p>
            <div className="flex flex-col gap-2">
              {vocab[facet].map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    aria-label={`${label} ${i + 1} label`}
                    value={t.label}
                    placeholder="Label"
                    onChange={e => patchRow(facet, i, { label: e.target.value })}
                    className="flex-1 border border-ink/20 rounded-lg px-3 py-1.5 bg-bone text-sm"
                  />
                  <input
                    aria-label={`${label} ${i + 1} code`}
                    value={t.code}
                    placeholder="code"
                    onChange={e => patchRow(facet, i, { code: e.target.value })}
                    className="w-32 border border-ink/20 rounded-lg px-2 py-1.5 bg-bone text-xs font-mono"
                  />
                  <label className="flex items-center gap-1 text-xs text-ink/55 shrink-0">
                    <input
                      type="checkbox"
                      checked={t.enabled !== false}
                      onChange={e => patchRow(facet, i, { enabled: e.target.checked })}
                    />
                    on
                  </label>
                  <button
                    type="button"
                    aria-label={`Remove ${label} ${i + 1}`}
                    onClick={() => setFacet(facet, vocab[facet].filter((_, j) => j !== i))}
                    className="text-clay px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFacet(facet, [...vocab[facet], { code: '', label: '', order: vocab[facet].length + 1, enabled: true }])}
                className="border border-dashed border-ink/20 rounded-lg w-full py-1.5 text-sm text-ink/55"
              >
                + Add value
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
