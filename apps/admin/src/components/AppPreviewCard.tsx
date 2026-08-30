import { useState } from 'react';
import type { RecipeInput } from '@vajeeva/shared';

export function AppPreviewCard({ recipe }: { recipe: RecipeInput }) {
  const [open, setOpen] = useState(false);

  const heroImg = (recipe.images as { url: string }[])?.[0]?.url;
  const hasIngredients = recipe.ingredients.some(i => i.nameEn);
  const hasSteps = recipe.steps.some(s => s.text);

  // ── Collapsed bar ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Expand app preview"
        className="w-full flex items-center gap-3 bg-bone border border-ink/[0.11] rounded-[14px] px-3 py-2.5 shadow-[0_1px_4px_rgba(42,37,30,.06)] hover:border-ink/25 transition-colors text-left"
      >
        {/* Small thumbnail or colour swatch */}
        <div className="shrink-0 w-12 h-12 rounded-[8px] overflow-hidden bg-brand/20 flex items-center justify-center">
          {heroImg ? (
            <img src={heroImg} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-brand text-[18px]">🍽</span>
          )}
        </div>

        {/* Title + ingredient pills */}
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[14px] text-ink truncate leading-tight">
            {recipe.nameEn || <span className="text-ink/35 italic">Untitled recipe</span>}
          </p>
          {hasIngredients && (
            <div className="flex flex-wrap gap-1 mt-1">
              {recipe.ingredients.filter(i => i.nameEn).slice(0, 4).map((ing, i) => (
                <span key={i} className="text-[10px] bg-cream border border-ink/[0.10] rounded-full px-2 py-0.5 text-ink/55 whitespace-nowrap">
                  {ing.nameEn}
                </span>
              ))}
              {recipe.ingredients.filter(i => i.nameEn).length > 4 && (
                <span className="text-[10px] text-ink/35">+{recipe.ingredients.filter(i => i.nameEn).length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg className="shrink-0 text-ink/35 w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  // ── Expanded card ──────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-bone border border-ink/[0.11] rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(42,37,30,.06)]">

      {/* Hero image or colour band */}
      <div className="relative h-36 bg-brand/20 flex items-end p-3">
        {heroImg ? (
          <img src={heroImg} alt="Recipe hero" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🍽</span>
        )}
        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded={true}
          aria-label="Collapse app preview"
          className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 rounded-full w-7 h-7 flex items-center justify-center transition-colors z-10"
        >
          <svg className="text-white w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 10L8 6l-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Title overlay */}
        <span className="font-serif font-semibold text-white drop-shadow relative z-10 leading-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,.5)' }}>
          {recipe.nameEn || <span className="opacity-50 italic">Untitled recipe</span>}
          {recipe.nameTa && (
            <span className="block text-[11px] font-light italic opacity-80">{recipe.nameTa}</span>
          )}
        </span>
      </div>

      {/* Meta row */}
      <div className="px-4 pt-3 pb-1 flex gap-1.5 flex-wrap">
        {recipe.yieldStr && (
          <span className="text-[10.5px] bg-sand text-ink/55 rounded-full px-2.5 py-0.5 font-medium">{recipe.yieldStr}</span>
        )}
        {recipe.shelfLife && (
          <span className="text-[10.5px] bg-sand text-ink/55 rounded-full px-2.5 py-0.5 font-medium">{recipe.shelfLife}</span>
        )}
        <span className="text-[10.5px] bg-sand text-ink/55 rounded-full px-2.5 py-0.5 font-medium">
          {recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="px-4 py-2 text-[12px] text-ink/55 leading-relaxed">{recipe.description}</p>
      )}

      {/* ── Ingredients accordion section ── */}
      {hasIngredients && (
        <ExpandSection label="Ingredients" defaultOpen>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recipe.ingredients.filter(i => i.nameEn).map((ing, i) => (
              <span key={i} className="text-[11px] bg-cream border border-ink/[0.09] rounded-full px-2.5 py-0.5 text-ink/60">
                {ing.nameEn}
                {ing.quantityCup && <span className="text-ink/35 ml-1">{ing.quantityCup}</span>}
              </span>
            ))}
          </div>
        </ExpandSection>
      )}

      {/* ── Method accordion section ── */}
      {hasSteps && (
        <ExpandSection label="Method">
          <ol className="pt-1 flex flex-col gap-2">
            {recipe.steps.filter(s => s.text).map((s, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {s.phase && (
                    <p className="text-[9.5px] uppercase tracking-[0.07em] text-ink/35 font-semibold mb-0.5">{s.phase}</p>
                  )}
                  <p className="text-[11.5px] text-ink/70 leading-snug">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </ExpandSection>
      )}

      <div className="h-3" />
    </div>
  );
}

// ── Collapsible section used inside the expanded card ─────────────────────────
function ExpandSection({ label, children, defaultOpen = false }: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-ink/[0.07] mx-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 text-left"
      >
        <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">{label}</span>
        <svg
          className={`w-3.5 h-3.5 text-ink/35 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}
