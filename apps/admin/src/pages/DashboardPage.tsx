import { useEffect, useMemo, useState } from 'react';
import { api, type RecipeDoc } from '../api/client';

const CATEGORY_COLORS: Record<string, string> = {
  solid: '#6E6656',
  liquid: '#3B6BA0',
  'semi-solid': '#C6902F',
};

const CATEGORY_LABELS: Record<string, string> = {
  solid: 'Solid',
  liquid: 'Liquid',
  'semi-solid': 'Semi-solid',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  return `${diffD}d ago`;
}

export function DashboardPage() {
  const [recipes, setRecipes] = useState<RecipeDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes')
      .then(setRecipes)
      .catch(e => setError((e as Error).message));
  }, []);

  const stats = useMemo(() => {
    if (!recipes) return null;
    const total = recipes.length;
    const published = recipes.filter(r => r.status === 'published').length;
    const drafts = recipes.filter(r => r.status === 'draft').length;
    const byCategory = (['solid', 'liquid', 'semi-solid'] as const).map(cat => ({
      label: CATEGORY_LABELS[cat],
      count: recipes.filter(r => r.category === cat).length,
      color: CATEGORY_COLORS[cat],
    }));
    const recent = [...recipes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map(r => ({
        name: r.nameEn,
        action: r.status === 'published' ? 'Published' : 'Draft saved',
        time: timeAgo(r.updatedAt),
        dot: r.status === 'published' ? '#3E6B4F' : '#C6902F',
      }));
    return { total, published, drafts, byCategory, recent };
  }, [recipes]);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-8 text-clay">{error}</p>
      : <p className="p-8 text-ink/55">Loading…</p>;
  }

  const maxCount = Math.max(...stats!.byCategory.map(c => c.count), 1);

  return (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-4">
        {/* Stat card */}
        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-2">Total Recipes</p>
          <p data-testid="total-recipes-count" className="font-serif text-[42px] font-bold text-ink leading-none">
            {stats!.total}
          </p>
          <p className="text-xs text-ink/55 mt-2">
            {stats!.published} published · {stats!.drafts} drafts
          </p>
        </div>

        {/* Category bar chart */}
        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-4">By Category</p>
          <div className="flex flex-col gap-3">
            {stats!.byCategory.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-ink/55 w-20 shrink-0">{c.label}</span>
                <div className="flex-1 bg-sand rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(c.count / maxCount) * 100}%`, backgroundColor: c.color }}
                  />
                </div>
                <b className="text-xs text-ink w-6 text-right shrink-0">{c.count}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Recent edits timeline */}
        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-4">Recent Edits</p>
          <div className="flex flex-col gap-4">
            {stats!.recent.length === 0 && (
              <p className="text-xs text-ink/55">No recipes yet.</p>
            )}
            {stats!.recent.map(item => (
              <div key={item.name} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.dot }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink/55">{item.action}</p>
                </div>
                <span className="text-xs text-ink/55 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
