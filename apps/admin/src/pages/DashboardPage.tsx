// Placeholder stats — wired to /api/admin endpoints in the wiring wave.
const STATS = {
  total: 83,
  published: 71,
  drafts: 12,
  byCategory: [
    { label: 'Solid', count: 38, color: '#6E6656' },
    { label: 'Liquid', count: 22, color: '#3B6BA0' },
    { label: 'Semi-solid', count: 23, color: '#C6902F' },
  ],
};

const RECENT = [
  { name: 'Coconut Burfi', action: 'Published', time: '2h ago', dot: '#3E6B4F' },
  { name: 'Banana Porridge', action: 'Draft saved', time: 'Yesterday', dot: '#C6902F' },
  { name: 'Ragi Malt', action: 'Published', time: '3d ago', dot: '#3E6B4F' },
];

export function DashboardPage() {
  const maxCount = Math.max(...STATS.byCategory.map(c => c.count));

  return (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-2">Total Recipes</p>
          <p data-testid="total-recipes-count" className="font-serif text-[42px] font-bold text-ink leading-none">
            {STATS.total}
          </p>
          <p className="text-xs text-ink/55 mt-2">
            {STATS.published} published · {STATS.drafts} drafts
          </p>
        </div>

        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-4">By Category</p>
          <div className="flex flex-col gap-3">
            {STATS.byCategory.map(c => (
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

        <div className="bg-bone border border-ink/20 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-4">Recent Edits</p>
          <div className="flex flex-col gap-4">
            {RECENT.map(item => (
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
