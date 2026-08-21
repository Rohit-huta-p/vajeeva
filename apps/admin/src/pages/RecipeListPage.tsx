import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RecipeDoc } from '../api/client';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

const STATUS_TABS = [
  { value: 'all' as const, label: 'All' },
  { value: 'published' as const, label: 'Published' },
  { value: 'draft' as const, label: 'Draft' },
];

export function RecipeListPage() {
  const [recipes, setRecipes] = useState<RecipeDoc[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes').then(setRecipes).catch(e => setError(e.message));
  }, []);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-6 text-clay">{error}</p>
      : <p className="p-6 text-ink/55">Loading…</p>;
  }

  const visible = statusFilter === 'all' ? recipes : recipes.filter(r => r.status === statusFilter);
  const published = recipes.filter(r => r.status === 'published').length;
  const drafts = recipes.filter(r => r.status === 'draft').length;

  return (
    <div className="p-6">
      {/* Stats row */}
      <div className="flex gap-3 mb-5">
        <div className="bg-bone border border-ink/20 rounded-lg px-4 py-2.5 text-sm">
          <span data-testid="stat-total" className="font-semibold text-ink">{recipes.length}</span>
          <span className="text-ink/55 ml-1.5">total</span>
        </div>
        <div className="bg-bone border border-ink/20 rounded-lg px-4 py-2.5 text-sm">
          <span data-testid="stat-published" className="font-semibold text-brand">{published}</span>
          <span className="text-ink/55 ml-1.5">published</span>
        </div>
        <div className="bg-bone border border-ink/20 rounded-lg px-4 py-2.5 text-sm">
          <span data-testid="stat-drafts" className="font-semibold text-amber">{drafts}</span>
          <span className="text-ink/55 ml-1.5">drafts</span>
        </div>

        {/* Filter tabs — pushed right */}
        <div
          role="tablist"
          aria-label="Filter by status"
          className="ml-auto flex gap-0.5 bg-bone border border-ink/20 rounded-lg p-0.5"
        >
          {STATUS_TABS.map(tab => {
            const count = tab.value === 'all' ? recipes.length
              : recipes.filter(r => r.status === tab.value).length;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-white text-ink font-medium shadow-sm'
                    : 'text-ink/55 hover:text-ink'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-ink/40">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 text-clay text-sm">{error}</p>}

      <table className="w-full bg-white border border-ink/20 rounded-lg text-sm">
        <thead>
          <tr className="bg-bone text-left text-xs uppercase text-ink/55">
            <th className="px-4 py-2.5 font-semibold">Name</th>
            <th className="px-4 py-2.5 font-semibold">Slug</th>
            <th className="px-4 py-2.5 font-semibold">Category</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(r => (
            <tr key={r._id} className="border-t border-ink/10">
              <td className="px-4 py-3">
                <span className="font-serif font-semibold">{r.nameEn}</span>
                {r.nameTa && <span className="block text-xs text-ink/55">{r.nameTa}</span>}
              </td>
              <td className="px-4 py-3 text-ink/55">{r.slug}</td>
              <td className="px-4 py-3">{CATEGORY_LABEL[r.category]}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    r.status === 'published'
                      ? 'bg-brand-bg text-brand rounded-full px-2.5 py-0.5 text-xs'
                      : 'bg-amber-bg text-amber rounded-full px-2.5 py-0.5 text-xs'
                  }
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 space-x-3">
                <button type="button" onClick={() => toggleStatus(r)} className="text-brand underline">
                  {r.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <Link to={`/recipes/${r._id}/edit`} className="text-brand underline">Edit</Link>
                <button type="button" onClick={() => remove(r)} className="text-clay underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && <p className="p-4 text-ink/55">No recipes match this filter.</p>}
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
