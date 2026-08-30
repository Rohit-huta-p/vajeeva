import type { RecipeInput } from '@vajeeva/shared';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

export function AppPreviewCard({ recipe }: { recipe: RecipeInput }) {
  const heroImg = (recipe.images as any[])?.[0]?.url as string | undefined;
  const heroColor = recipe.steps[0]?.illColor ?? '#2A3828';

  return (
    <aside aria-label="App preview" className="bg-bone border border-ink/[0.11] rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(42,37,30,.12)]">
      {/* Hero */}
      <div
        className="h-36 flex items-end p-3 relative"
        style={heroImg
          ? undefined
          : { backgroundColor: heroColor }
        }
      >
        {heroImg && (
          <img
            src={heroImg}
            alt="Recipe hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <span
          className="font-serif font-semibold text-white drop-shadow relative z-10 leading-tight"
          style={heroImg ? { textShadow: '0 1px 6px rgba(0,0,0,.55)' } : undefined}
        >
          {recipe.nameEn || 'Untitled recipe'}
          {recipe.nameTa && (
            <span className="block text-[12px] font-light italic opacity-80">{recipe.nameTa}</span>
          )}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        <div className="flex gap-1.5 flex-wrap">
          <span className="bg-sand text-ink/55 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
            {CATEGORY_LABEL[recipe.category]}
          </span>
          {recipe.healthFlags.filter(f => f.severity === 'safe').slice(0, 2).map(f => (
            <span key={f.condition} className="bg-brand-bg text-brand rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              {f.condition}
            </span>
          ))}
        </div>

        {recipe.description && (
          <p className="text-[12px] text-ink/55 leading-relaxed line-clamp-2">{recipe.description}</p>
        )}

        <p className="text-[11.5px] text-ink/40">
          {recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}
          {recipe.shelfLife ? ` · ${recipe.shelfLife}` : ''}
          {recipe.yieldStr ? ` · ${recipe.yieldStr}` : ''}
        </p>

        {/* Ingredients preview */}
        {recipe.ingredients.length > 0 && recipe.ingredients[0].nameEn && (
          <div className="border-t border-ink/[0.08] pt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/35 mb-1.5">Ingredients</p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 5).map((ing, i) => (
                <span key={i} className="text-[11px] bg-cream border border-ink/[0.08] rounded-full px-2 py-0.5 text-ink/55">
                  {ing.nameEn}
                </span>
              ))}
              {recipe.ingredients.length > 5 && (
                <span className="text-[11px] text-ink/35">+{recipe.ingredients.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
