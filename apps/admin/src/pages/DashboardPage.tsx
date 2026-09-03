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

// Engagement metrics from GET /api/admin/stats. See
// docs/specs/2026-09-03-admin-outcomes.md (Phase 2).
interface Stats {
  users: { total: number; active7d: number; active30d: number };
  saves: number;
  makes: number;
  savedNotMade: number;
  avgRating: number | null;
  makesByWeek: { week: string; count: number }[];
  mostCooked: { slug: string; nameEn: string; makes: number }[];
}

function timeAgo(iso: string): string {
  const diffH = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? 'Yesterday' : `${diffD}d ago`;
}

export function DashboardPage() {
  const [recipes, setRecipes] = useState<RecipeDoc[] | null>(null);
  const [eng,     setEng]     = useState<Stats | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes').then(setRecipes).catch(e => setError((e as Error).message));
    api<Stats>('/api/admin/stats').then(setEng).catch(() => setEng(null)); // degrade gracefully
  }, []);

  const content = useMemo(() => {
    if (!recipes) return null;
    return {
      total:     recipes.length,
      published: recipes.filter(r => r.status === 'published').length,
      drafts:    recipes.filter(r => r.status === 'draft').length,
      byCategory: (['solid', 'liquid', 'semi-solid'] as const).map(cat => ({
        label: CATEGORY_LABELS[cat],
        count: recipes.filter(r => r.category === cat).length,
        color: CATEGORY_COLORS[cat],
      })),
      recent: [...recipes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(r => ({
          name: r.nameEn,
          action: r.status === 'published' ? 'Published' : 'Draft saved',
          time: timeAgo(r.updatedAt),
          dot: r.status === 'published' ? '#3E6B4F' : '#C6902F',
        })),
    };
  }, [recipes]);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-8 text-clay">{error}</p>
      : <p className="p-8 text-ink/45">Loading…</p>;
  }

  const maxCat = Math.max(...content!.byCategory.map(c => c.count), 1);
  const savesVsMax = Math.max(eng?.saves ?? 0, eng?.makes ?? 0, 1);

  return (
    <div className="p-5 md:p-7">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-serif text-[22px] font-light text-ink leading-tight tracking-tight">
          Good morning, <em>Anand.</em>
        </h1>
        <p className="text-[13px] text-ink/55 mt-1">How patients are engaging with Vajeeva.</p>
      </div>

      {/* ── Engagement KPIs ─────────────────── */}
      <SectionLabel>Engagement</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard value={eng?.users.active30d ?? '—'} label="Active (30d)" color="text-brand"
          note={eng ? `${eng.users.total} total · ${eng.users.active7d} this week` : 'Coming soon'} />
        <StatCard value={eng?.makes ?? '—'} label="Makes logged" />
        <StatCard value={eng?.saves ?? '—'} label="Saves" color="text-sky" />
        <StatCard value={eng?.avgRating != null ? eng.avgRating.toFixed(1) : '—'} label="Avg rating" color="text-amber"
          note={eng?.avgRating != null ? '★ out of 5' : 'no ratings yet'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Makes over time */}
        <Panel title="Makes over time" hint="last 8 weeks">
          <WeeklyBars data={eng?.makesByWeek ?? []} />
        </Panel>

        {/* Most cooked */}
        <Panel title="Most cooked">
          {eng?.mostCooked?.length ? (
            <div className="flex flex-col">
              {eng.mostCooked.map((m, i) => (
                <div key={m.slug || i} className="flex items-center gap-3 py-2 border-b border-ink/[0.08] last:border-0">
                  <span className="text-[12px] text-ink/40 tabular-nums w-4 shrink-0">{i + 1}</span>
                  <span className="text-[13px] font-medium text-ink truncate flex-1">{m.nameEn}</span>
                  <span className="text-[12px] text-ink/55 tabular-nums shrink-0">{m.makes}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-ink/45">No cooks logged yet.</p>}
        </Panel>
      </div>

      {/* Saves vs makes */}
      <div className="mb-6">
        <Panel title="Saves vs makes">
          <div className="flex flex-col gap-3.5">
            <MeterRow label="Saves" value={eng?.saves ?? 0} max={savesVsMax} color="#3E709C" />
            <MeterRow label="Makes" value={eng?.makes ?? 0} max={savesVsMax} color="#3E6B4F" />
            <p className="text-[12px] text-ink/55">
              <span className="font-semibold text-ink">{eng?.savedNotMade ?? 0}</span> saved but never
              made — a friction signal (steps too hard, or the wrong recipes surfaced).
            </p>
          </div>
        </Panel>
      </div>

      {/* ── Library ─────────────────────────── */}
      <SectionLabel>Library</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard value={content!.total}     label="Total recipes" testId="total-recipes-count"
          note={`${content!.published} published · ${content!.drafts} drafts`} />
        <StatCard value={content!.published} label="Published" color="text-brand" />
        <StatCard value={content!.drafts}    label="Drafts"    color="text-amber" />
        <StatCard value={eng?.users.total ?? '—'} label="Patients" color="text-sky" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickAction emoji="📝" title="New Recipe"   desc="Add a recipe to the library"  to="/recipes/new" bg="bg-brand-bg" />
        <QuickAction emoji="🏷️" title="Manage Tags"  desc="Edit discovery tag vocabulary" to="/tags"        bg="bg-sky-bg" />
        <QuickAction emoji="❤️" title="Health Flags" desc="Update condition labels"       to="/health-flags" bg="bg-clay-bg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Recent activity">
          {content!.recent.length === 0 ? (
            <p className="text-[12.5px] text-ink/45">No recipes yet.</p>
          ) : (
            <div className="flex flex-col">
              {content!.recent.map((item, i) => (
                <div key={`${item.name}-${i}`} className="flex items-start gap-3 py-2.5 border-b border-ink/[0.08] last:border-0">
                  <div className="w-[7px] h-[7px] rounded-full mt-[6px] shrink-0" style={{ backgroundColor: item.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{item.name}</p>
                    <p className="text-[11.5px] text-ink/55">{item.action}</p>
                  </div>
                  <span className="text-[11.5px] text-ink/45 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="By category">
          <div className="flex flex-col gap-4">
            {content!.byCategory.map(c => (
              <MeterRow key={c.label} label={c.label} value={c.count} max={maxCat} color={c.color} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink/40 mb-3">{children}</p>;
}

function StatCard({ value, label, color = 'text-ink', note, testId }: {
  value: number | string; label: string; color?: string; note?: string; testId?: string;
}) {
  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(42,37,30,.07)]">
      <p data-testid={testId} className={`font-serif text-[40px] font-light leading-none mb-1 tabular-nums ${color}`}>
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink/45">{label}</p>
      {note && <p className="text-[11px] text-ink/35 mt-1">{note}</p>}
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="font-serif text-[15.5px] font-light text-ink tracking-tight">{title}</p>
        {hint && <span className="text-[11px] text-ink/40">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function MeterRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[12px] text-ink/45 tabular-nums">{value}</span>
      </div>
      <div className="h-[8px] rounded-full bg-sand overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function WeeklyBars({ data }: { data: { week: string; count: number }[] }) {
  if (!data.length) return <p className="text-[12.5px] text-ink/45">No data yet.</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-[92px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.week}: ${d.count}`}>
            <span className="text-[10px] text-ink/40 tabular-nums mb-1">{d.count || ''}</span>
            <div className="w-full rounded-t-[3px] bg-brand"
              style={{ height: `${Math.max(3, (d.count / max) * 64)}px`, opacity: d.count ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-ink/35">
        <span>{data[0]?.week.slice(5)}</span>
        <span>{data[data.length - 1]?.week.slice(5)}</span>
      </div>
    </div>
  );
}

function QuickAction({ emoji, title, desc, to, bg }: {
  emoji: string; title: string; desc: string; to: string; bg: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-3.5 bg-bone border border-ink/[0.11] rounded-[14px] p-4 hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-shadow">
      <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px] shrink-0 ${bg}`}>{emoji}</div>
      <div>
        <div className="text-[13.5px] font-semibold text-ink leading-tight">{title}</div>
        <div className="text-[11.5px] text-ink/50 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}
