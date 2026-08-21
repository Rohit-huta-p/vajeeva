import type { RecipeInput } from '@vajeeva/shared';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

export function AppPreviewCard({ recipe }: { recipe: RecipeInput }) {
  return (
    <aside aria-label="App preview" className="bg-white border border-ink/20 rounded-xl overflow-hidden shadow-md">
      <div
        className="h-32 flex items-end p-3"
        style={{ backgroundColor: recipe.steps[0]?.illColor ?? '#2A3828' }}
      >
        <span className="font-serif font-semibold text-white drop-shadow">
          {recipe.nameEn || 'Untitled recipe'}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          <span className="bg-bone text-ink/55 rounded px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[recipe.category]}
          </span>
          {recipe.healthFlags.filter(f => f.severity === 'safe').slice(0, 1).map(f => (
            <span key={f.condition} className="bg-brand-bg text-brand rounded px-2 py-0.5 text-xs">
              {f.condition}
            </span>
          ))}
        </div>
        <p className="text-xs text-ink/55 leading-relaxed">{recipe.description}</p>
        <p className="text-xs text-ink/55">
          {recipe.steps.length} steps · shelf life {recipe.shelfLife || '—'}
        </p>
      </div>
    </aside>
  );
}
