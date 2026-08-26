import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type RecipeDoc } from '../api/client';

type CatFilter = 'all' | 'solid' | 'liquid' | 'semi-solid';
type SortBy    = 'recent' | 'az' | 'za';

const CAT_LABEL: Record<string, string> = {
  solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid',
};

// Category accent colour for the top stripe on each card
const CAT_STRIPE: Record<string, string> = {
  solid:       '#3E6B4F',
  liquid:      '#3E709C',
  'semi-solid':'#C6902F',
};

// Category badge styles
const CAT_BADGE: Record<string, string> = {
  solid:       'bg-brand-bg text-brand',
  liquid:      'bg-sky-bg text-sky',
  'semi-solid':'bg-amber-bg text-amber',
};

const CAT_CHIPS: { value: CatFilter; label: string }[] = [
  { value: 'all',        label: 'All'       },
  { value: 'solid',      label: 'Solid'     },
  { value: 'liquid',     label: 'Liquid'    },
  { value: 'semi-solid', label: 'Semi-solid'},
];

export function RecipeListPage() {
  const [recipes,   setRecipes]   = useState<RecipeDoc[] | null>(null);
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [sort,      setSort]      = useState<SortBy>('recent');
  const [error,     setError]     = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes').then(setRecipes).catch(e => setError(e.message));
  }, []);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-6 text-clay">{error}</p>
      : <p className="p-6 text-ink/45">Loading…</p>;
  }

  // Filter
  const searched = q
    ? recipes.filter(r =>
        r.nameEn.toLowerCase().includes(q) ||
        (r.nameTa ?? '').toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q))
    : recipes;

  const filtered = catFilter === 'all' ? searched : searched.filter(r => r.category === catFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'az') return a.nameEn.localeCompare(b.nameEn);
    if (sort === 'za') return b.nameEn.localeCompare(a.nameEn);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const drafts    = sorted.filter(r => r.status === 'draft');
  const published = sorted.filter(r => r.status === 'published');

  return (
    <div className="p-5 md:p-6">

      {/* ── Filter / sort bar ─────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap">
          {CAT_CHIPS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCatFilter(c.value)}
              className={[
                'px-3 py-[5px] rounded-full text-[12px] font-semibold border-[1.5px] transition-all',
                catFilter === c.value
                  ? c.value === 'all'
                    ? 'bg-ink text-cream border-ink'
                    : c.value === 'solid'
                      ? 'bg-brand-bg text-brand border-brand/30'
                      : c.value === 'liquid'
                        ? 'bg-sky-bg text-sky border-sky/30'
                        : 'bg-amber-bg text-amber border-amber/30'
                  : 'bg-bone text-ink/55 border-ink/[0.11] hover:border-ink/30',
              ].join(' ')}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortBy)}
          className="ml-auto border border-ink/[0.11] rounded-[10px] bg-bone px-3 py-[5px] text-[12.5px] text-ink cursor-pointer"
        >
          <option value="recent">Recently updated</option>
          <option value="az">Name A–Z</option>
          <option value="za">Name Z–A</option>
        </select>
      </div>

      {error && <p role="alert" className="mb-4 text-clay text-sm">{error}</p>}

      {/* ── Kanban columns ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

        {/* Draft column */}
        <div className="rounded-[14px] p-3.5 bg-amber-bg border border-amber/[0.16]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-[800] tracking-[0.07em] uppercase text-amber">Draft</span>
            <span className="text-[10.5px] font-[800] px-2 py-0.5 rounded-full bg-amber/[0.15] text-amber">
              {drafts.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5" id="col-draft">
            {drafts.map(r => (
              <RecipeCard key={r._id} recipe={r} onToggle={toggleStatus} onDelete={remove} />
            ))}
            {drafts.length === 0 && (
              <p className="text-center py-6 text-[12.5px] text-amber/60">No drafts</p>
            )}
          </div>
        </div>

        {/* Published column */}
        <div className="rounded-[14px] p-3.5 bg-brand-bg border border-brand/[0.16]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-[800] tracking-[0.07em] uppercase text-brand">Published</span>
            <span className="text-[10.5px] font-[800] px-2 py-0.5 rounded-full bg-brand/[0.15] text-brand">
              {published.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5" id="col-pub">
            {published.map(r => (
              <RecipeCard key={r._id} recipe={r} onToggle={toggleStatus} onDelete={remove} />
            ))}
            {published.length === 0 && (
              <p className="text-center py-6 text-[12.5px] text-brand/60">No published recipes</p>
            )}
          </div>
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="text-center py-8 text-ink/45">No recipes match this filter.</p>
      )}
    </div>
  );

  async function toggleStatus(r: RecipeDoc) {
    const next = r.status === 'published' ? ('draft' as const) : ('published' as const);
    const prev = recipes!;
    setError(null);
    setRecipes(prev.map(x => (x._id === r._id ? { ...x, status: next } : x)));
    try {
      await api(`/api/admin/recipes/${r._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
    } catch (e) {
      setRecipes(prev);
      setError((e as Error).message);
    }
  }

  async function remove(r: RecipeDoc) {
    if (!window.confirm(`Delete "${r.nameEn}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api(`/api/admin/recipes/${r._id}`, { method: 'DELETE' });
      setRecipes(rs => rs!.filter(x => x._id !== r._id));
    } catch (e) {
      setError((e as Error).message);
    }
  }
}

// ── Recipe card ────────────────────────────────────────────────────────────
function RecipeCard({
  recipe: r,
  onToggle,
  onDelete,
}: {
  recipe: RecipeDoc;
  onToggle: (r: RecipeDoc) => void;
  onDelete:  (r: RecipeDoc) => void;
}) {
  const isDraft = r.status === 'draft';

  const thumbUrl = (r.images as any[])?.[0]?.url as string | undefined;

  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[10px] overflow-hidden shadow-[0_1px_3px_rgba(42,37,30,.07)] hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-shadow">
      {/* Category stripe */}
      <div className="h-[3px]" style={{ backgroundColor: CAT_STRIPE[r.category] ?? '#8A8278' }} />

      <div className="flex items-stretch gap-0">
        {/* Thumbnail — left side */}
        {thumbUrl && (
          <div className="w-[72px] shrink-0 self-stretch overflow-hidden border-r border-ink/[0.08]">
            <img
              src={thumbUrl}
              alt={r.nameEn}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 p-3 pb-2.5 min-w-0">
          {/* Name */}
          <div className="font-serif text-[13.5px] font-semibold text-ink leading-tight truncate">{r.nameEn}</div>
          {r.nameTa && (
            <div className="text-[12px] text-ink/55 italic mt-0.5 truncate">{r.nameTa}</div>
          )}

          {/* Category badge */}
          <div className="mt-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_BADGE[r.category] ?? 'bg-sand text-ink/55'}`}>
              {CAT_LABEL[r.category] ?? r.category}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-ink/[0.08]">
            <div className="flex gap-3">
              <Link
                to={`/recipes/${r._id}/edit`}
                className="text-[11.5px] font-semibold text-brand hover:underline"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => onDelete(r)}
                className="text-[11.5px] font-semibold text-clay hover:underline"
              >
                Delete
              </button>
            </div>
            <button
              type="button"
              onClick={() => onToggle(r)}
              className={[
                'text-[11.5px] font-bold px-3 py-1 rounded-full transition-colors',
                isDraft
                  ? 'bg-brand/10 text-brand hover:bg-brand/20'
                  : 'bg-amber/10 text-amber hover:bg-amber/20',
              ].join(' ')}
            >
              {isDraft ? 'Publish →' : '← Draft'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
