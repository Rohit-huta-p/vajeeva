import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RecipeDoc } from '../api/client';

const CATEGORY_COLORS: Record<string, string> = {
  solid:       '#3E6B4F',
  liquid:      '#3E709C',
  'semi-solid':'#C6902F',
};

const CATEGORY_LABELS: Record<string, string> = {
  solid:       'Solid',
  liquid:      'Liquid',
  'semi-solid':'Semi-solid',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH  = Math.floor(diffMs / 3_600_000);
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  return `${diffD}d ago`;
}

export function DashboardPage() {
  const [recipes, setRecipes] = useState<RecipeDoc[] | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes')
      .then(setRecipes)
      .catch(e => setError((e as Error).message));
  }, []);

  const stats = useMemo(() => {
    if (!recipes) return null;
    const total     = recipes.length;
    const published = recipes.filter(r => r.status === 'published').length;
    const drafts    = recipes.filter(r => r.status === 'draft').length;
    const byCategory = (['solid', 'liquid', 'semi-solid'] as const).map(cat => ({
      label: CATEGORY_LABELS[cat],
      count: recipes.filter(r => r.category === cat).length,
      color: CATEGORY_COLORS[cat],
    }));
    const recent = [...recipes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(r => ({
        name:   r.nameEn,
        action: r.status === 'published' ? 'Published' : 'Draft saved',
        time:   timeAgo(r.updatedAt),
        dot:    r.status === 'published' ? '#3E6B4F' : '#C6902F',
      }));
    return { total, published, drafts, byCategory, recent };
  }, [recipes]);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-8 text-clay">{error}</p>
      : <p className="p-8 text-ink/45">Loading…</p>;
  }

  const maxCount = Math.max(...stats!.byCategory.map(c => c.count), 1);

  return (
    <div className="p-5 md:p-7">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-serif text-[22px] font-light text-ink leading-tight tracking-tight">
          Good morning, <em>Anand.</em>
        </h1>
        <p className="text-[13px] text-ink/55 mt-1">
          Here's what's happening with the Vajeeva recipe library.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard value={stats!.total}     label="Total Recipes" />
        <StatCard value={stats!.published} label="Published"     color="text-brand" />
        <StatCard value={stats!.drafts}    label="Drafts"        color="text-amber" />
        <StatCard value="—"                label="Users"         color="text-sky"   note="Coming soon" />
      </div>

      {/* ── Quick actions ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickAction
          emoji="📝"
          title="New Recipe"
          desc="Add a recipe to the library"
          to="/recipes/new"
          bg="bg-brand-bg"
        />
        <QuickAction
          emoji="🏷️"
          title="Manage Tags"
          desc="Edit discovery tag vocabulary"
          to="/tags"
          bg="bg-sky-bg"
        />
        <QuickAction
          emoji="❤️"
          title="Health Flags"
          desc="Update condition labels"
          to="/health-flags"
          bg="bg-clay-bg"
        />
      </div>

      {/* ── Lower two-col ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent activity */}
        <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5">
          <p className="font-serif text-[15.5px] font-light text-ink mb-4 tracking-tight">
            Recent activity
          </p>
          {stats!.recent.length === 0 ? (
            <p className="text-[12.5px] text-ink/45">No recipes yet.</p>
          ) : (
            <div className="flex flex-col">
              {stats!.recent.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-start gap-3 py-2.5 border-b border-ink/[0.08] last:border-0"
                >
                  <div
                    className="w-[7px] h-[7px] rounded-full mt-[6px] shrink-0"
                    style={{ backgroundColor: item.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{item.name}</p>
                    <p className="text-[11.5px] text-ink/55">{item.action}</p>
                  </div>
                  <span className="text-[11.5px] text-ink/45 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By category */}
        <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5">
          <p className="font-serif text-[15.5px] font-light text-ink mb-4 tracking-tight">
            By category
          </p>
          <div className="flex flex-col gap-4">
            {stats!.byCategory.map(c => (
              <div key={c.label}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[13px] font-medium text-ink">{c.label}</span>
                  <span className="text-[12px] text-ink/45 tabular-nums">{c.count}</span>
                </div>
                <div className="h-[8px] rounded-full bg-sand overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(c.count / maxCount) * 100}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────
function StatCard({ value, label, color = 'text-ink', note }: {
  value: number | string;
  label: string;
  color?: string;
  note?: string;
}) {
  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(42,37,30,.07)]">
      <p className={`font-serif text-[40px] font-light leading-none mb-1 tabular-nums ${color}`}>
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink/45">{label}</p>
      {note && <p className="text-[11px] text-ink/35 mt-1">{note}</p>}
    </div>
  );
}

function QuickAction({ emoji, title, desc, to, bg }: {
  emoji: string; title: string; desc: string; to: string; bg: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3.5 bg-bone border border-ink/[0.11] rounded-[14px] p-4 hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-shadow"
    >
      <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px] shrink-0 ${bg}`}>
        {emoji}
      </div>
      <div>
        <div className="text-[13.5px] font-semibold text-ink leading-tight">{title}</div>
        <div className="text-[11.5px] text-ink/50 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}
