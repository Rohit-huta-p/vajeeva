import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

interface Photo { url: string; publicId: string; caption: string }
interface Flag {
  slug: string; nameEn: string; condition: string; conditionLabel: string;
  severity: 'caution'; saved: boolean; made: boolean;
}
interface Make { slug: string; nameEn: string; madeAt: string; rating: number | null; photos: Photo[] }
interface PhotoMake {
  slug: string; nameEn: string; madeAt: string; rating: number | null; flagged: boolean; photos: Photo[];
}
interface Detail {
  profile: {
    id: string; name?: string; email: string; phone?: string; age?: number; gender?: string;
    joinedAt: string; lastActiveAt: string | null; conditions: { code: string; label: string }[];
  };
  engagement: { saves: number; makes: number; lastMadeAt: string | null; recentMakes: Make[]; photoMakes: PhotoMake[] };
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
const stars = (r: number) => '★'.repeat(Math.round(r / 1.7) || 1);
const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { weekday: 'short' })} · ${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

function Clock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/35 shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Sized Cloudinary thumb (fill). Non-Cloudinary URLs pass through. */
function thumb(url: string, w: number, h: number): string {
  const m = '/upload/';
  const i = url.indexOf(m);
  return i === -1 ? url : `${url.slice(0, i + m.length)}c_fill,w_${w},h_${h},q_auto,f_auto/${url.slice(i + m.length)}`;
}

export function UserDetailPage() {
  const { id } = useParams();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Detail>(`/api/admin/users/${id}`).then(setD).catch(e => setError((e as Error).message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const removePhoto = async (publicId: string) => {
    if (!window.confirm("Remove this photo? It's permanently deleted from the patient's kitchen.")) return;
    try {
      await api(`/api/admin/users/${id}/photo`, { method: 'DELETE', body: JSON.stringify({ publicId }) });
      load();
    } catch (e) { setError((e as Error).message); }
  };

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
  const photoMakes = d.engagement.photoMakes ?? [];
  // Group photo'd preparations by calendar day (photoMakes arrives newest-first).
  const dayGroups: { key: string; label: string; makes: PhotoMake[] }[] = [];
  for (const mk of photoMakes) {
    const k = dayKey(mk.madeAt);
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.key === k) last.makes.push(mk);
    else dayGroups.push({ key: k, label: dayLabel(mk.madeAt), makes: [mk] });
  }

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
                  <span className="mt-0.5 text-[9.5px] font-[800] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full shrink-0 bg-amber-bg text-amber">
                    {f.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink leading-tight">{f.nameEn}</p>
                    <p className="text-[11.5px] text-ink/55">
                      {f.conditionLabel}
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
                  {m.photos.length > 0 && (
                    <img src={thumb(m.photos[0].url, 64, 64)} alt="" className="w-7 h-7 rounded object-cover bg-ink/5 shrink-0" />
                  )}
                  <span className="text-[13px] font-medium text-ink truncate flex-1">{m.nameEn}</span>
                  {m.photos.length > 1 && <span className="text-[10px] text-ink/40 shrink-0">+{m.photos.length - 1}</span>}
                  {m.rating != null && <span className="text-[12px] text-amber tabular-nums shrink-0">{stars(m.rating)}</span>}
                  <span className="text-[11.5px] text-ink/45 shrink-0">{ago(m.madeAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preparations — day by day. See docs/specs/2026-09-09-prepared-photos.md §7. */}
      <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 mt-4">
        <p className="font-serif text-[15.5px] font-light text-ink tracking-tight mb-1">Preparations</p>
        <p className="text-[11.5px] text-ink/45 mb-4">
          Dishes {name} photographed and logged, newest first · shared with their care team.
        </p>
        {dayGroups.length === 0 ? (
          <p className="text-[12.5px] text-ink/45">No preparations with photos yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {dayGroups.map(group => (
              <div key={group.key}>
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-ink/40 pb-1.5 mb-1 border-b border-ink/[0.08]">{group.label}</p>
                <div className="flex flex-col">
                  {group.makes.map((mk, i) => (
                    <div key={`${mk.slug}-${mk.madeAt}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-ink/[0.06] last:border-0">
                      <div className="flex gap-1.5 shrink-0">
                        {mk.photos.map(p => (
                          <div key={p.publicId} className="group relative">
                            <a href={p.url} target="_blank" rel="noreferrer">
                              <img src={thumb(p.url, 132, 132)} alt={mk.nameEn} className="w-11 h-11 rounded-[8px] object-cover bg-ink/5" />
                            </a>
                            <button
                              onClick={() => removePhoto(p.publicId)}
                              className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-ink/70 text-white text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              aria-label="Remove photo"
                            >×</button>
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-ink leading-tight">{mk.nameEn}</span>
                          {mk.flagged && (
                            <span className="text-[9px] font-[800] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-amber-bg text-amber">flagged</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock />
                          <span className="text-[11.5px] text-ink/50">{timeOfDay(mk.madeAt)}</span>
                          {mk.rating ? <span className="text-[11px] text-amber tracking-[1px]">{stars(mk.rating)}</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
