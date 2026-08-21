import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RecipeDoc } from '../api/client';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

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

  return (
    <main className="min-h-screen bg-cream p-6">
      <header className="flex items-center gap-4 mb-6">
        <h1 className="font-serif text-xl font-semibold text-ink flex-1">Recipes</h1>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Link to="/recipes/new" className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium">
          New Recipe
        </Link>
      </header>

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
    </main>
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
