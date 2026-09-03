import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

interface Flag {
  slug: string; nameEn: string; condition: string; conditionLabel: string;
  severity: 'avoid' | 'caution'; note: string; saved: boolean; made: boolean;
}
interface Make { slug: string; nameEn: string; madeAt: string; rating: number | null }
interface Detail {
  profile: {
    id: string; name?: string; email: string; phone?: string; age?: number; gender?: string;
    joinedAt: string; lastActiveAt: string | null; conditions: { code: string; label: string }[];
  };
  engagement: { saves: number; makes: number; lastMadeAt: string | null; recentMakes: Make[] };
  adherence: { flags: Flag[] };
  satisfaction: { avgRating: number | null; ratingCount: number };
}

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d}d ago`;
  if (d < 60) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
const dateOnly = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function UserDetailPage() {
  const { id } = useParams();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Detail>(`/api/admin/users/${id}`).then(setD).catch(e => setError((e as Error).message));
  }, [id]);

  if (error) {
    return (
      <div className="p-5 md:p-7">
        <BackLink />
        <p role="alert" className="text-clay mt-4">{error}</p>
      </div>
    );
  }
  if (!d) return <p className="p-8 text-ink/45">Loading…</p>;

  const name = d.profile.name || d.profile.email.split('@')[0];

  return (
    <div className="p-5 md:p-7">
      <BackLink />

      {/* Header */}
      <div className="mt-3 mb-6">
        <h1 className="font-serif text-[22px] font-light text-ink tracking-tight">{name}</h1>
        <p className="text-[12.5px] text-ink/55 mt-0.5">
          {d.profile.email}
          {d.profile.age != null || d.profile.gender ? ' · ' : ''}
          {[d.profile.age, d.profile.gender].filter(Boolean).join(' · ')}
          {' · '}joined {dateOnly(d.profile.joinedAt)} · last active {ago(d.profile.lastActiveAt)}
        </p>
        {d.profile.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {d.profile.conditions.map(c => (
              <span key={c.code} className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-clay-bg text-clay">
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <Stat value={d.engagement.makes} label="Makes" />
        <Stat value={d.engagement.saves} label="Saves" color="text-sky" />
        <Stat value={ago(d.engagement.lastMadeAt)} label="Last made" small />
        <Stat value={d.satisfaction.avgRating != null ? d.satisfaction.avgRating.toFixed(1) : '—'} label="Avg rating"
          color="text-amber" note={d.satisfaction.avgRating != null ? `${d.satisfaction.ratingCount} rated` : 'no ratings'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adherence — flags to review */}
        <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5">
          <p className="font-serif text-[15.5px] font-light text-ink tracking-tight mb-1">Flags to review</p>
          <p className="text-[11.5px] text-ink/45 mb-4">
            Recipes they saved or made that are flagged for their conditions.
          </p>
          {d.adherence.flags.length === 0 ? (
            <p className="text-[12.5px] text-brand">✓ No conflicts with their health profile.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {d.adherence.flags.map((f, i) => (
                <div key={`${f.slug}-${f.condition}-${i}`} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 text-[9.5px] font-[800] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full shrink-0 ${
                    f.severity === 'avoid' ? 'bg-clay-bg text-clay' : 'bg-amber-bg text-amber'}`}>
                    {f.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink leading-tight">{f.nameEn}</p>
                    <p className="text-[11.5px] text-ink/55">
                      {f.conditionLabel}{f.note ? ` — ${f.note}` : ''}
                      {' · '}{[f.made && 'made', f.saved && 'saved'].filter(Boolean).join(' & ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent makes */}
        <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5">
          <p className="font-serif text-[15.5px] font-light text-ink tracking-tight mb-4">Recent makes</p>
          {d.engagement.recentMakes.length === 0 ? (
            <p className="text-[12.5px] text-ink/45">No makes logged yet.</p>
          ) : (
            <div className="flex flex-col">
              {d.engagement.recentMakes.map((m, i) => (
                <div key={`${m.slug}-${i}`} className="flex items-center gap-3 py-2 border-b border-ink/[0.08] last:border-0">
                  <span className="text-[13px] font-medium text-ink truncate flex-1">{m.nameEn}</span>
                  {m.rating != null && <span className="text-[12px] text-amber tabular-nums shrink-0">{'★'.repeat(Math.round(m.rating / 1.7) || 1)}</span>}
                  <span className="text-[11.5px] text-ink/45 shrink-0">{ago(m.madeAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return <Link to="/users" className="text-[12.5px] text-ink/55 hover:text-ink">← All users</Link>;
}

function Stat({ value, label, color = 'text-ink', note, small }: {
  value: number | string; label: string; color?: string; note?: string; small?: boolean;
}) {
  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(42,37,30,.07)]">
      <p className={`font-serif font-light leading-none mb-1 tabular-nums ${small ? 'text-[20px]' : 'text-[40px]'} ${color}`}>
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink/45">{label}</p>
      {note && <p className="text-[11px] text-ink/35 mt-1">{note}</p>}
    </div>
  );
}
