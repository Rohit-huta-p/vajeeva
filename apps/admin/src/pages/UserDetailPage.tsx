import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

interface Photo { url: string; publicId: string; caption: string }
interface Flag {
  slug: string; nameEn: string; condition: string; conditionLabel: string;
  severity: 'caution'; saved: boolean; made: boolean;
}
interface Make { slug: string; nameEn: string; madeAt: string; rating: number | null; photos: Photo[] }
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
const stars = (r: number) => '★'.repeat(Math.round(r / 1.7) || 1);

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

      <DietaryDiary userId={id!} patientName={name} />
    </div>
  );
}

// ── Dietary diary ────────────────────────────────────────────────────────────
// docs/specs/2026-09-20-dietary-diary.md — a calendar heatmap. Every program day
// is a cell coloured by the patient's adherence; missed and not-yet-reached days
// are shown honestly. Click a day to drill into its meals, photos, and remarks
// (adherence + remarks are editable there; a photo can be removed).
interface DiaryItem { slug: string; nameEn: string; madeAt: string; rating: number | null; flagged: boolean; photos: Photo[] }
type Adherence = 'followed' | 'partial' | 'deviated';
interface DiaryRow {
  day: number; date: string;
  morning: DiaryItem[]; afternoon: DiaryItem[]; night: DiaryItem[];
  adherence: Adherence | null; remarks: string; amendedByAdmin: boolean; flagged: boolean;
}
interface DiaryResp { programStartAt: string | null; startDate: string; today: string; rows: DiaryRow[] }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS: { key: 'morning' | 'afternoon' | 'night'; label: string }[] = [
  { key: 'morning', label: 'morning' }, { key: 'afternoon', label: 'afternoon' }, { key: 'night', label: 'night' },
];
const adhMeta: Record<Adherence, { label: string; text: string; bg: string; fill: string }> = {
  followed: { label: 'Followed', text: 'text-brand', bg: 'bg-brand-bg', fill: 'bg-brand' },
  partial:  { label: 'Partly',   text: 'text-amber', bg: 'bg-amber-bg', fill: 'bg-amber' },
  deviated: { label: 'Off plan', text: 'text-clay',  bg: 'bg-clay-bg',  fill: 'bg-clay' },
};

// All date maths run on 'YYYY-MM-DD' strings — lexicographic compares dodge the
// timezone drift a Date round-trip would introduce.
const pad2 = (n: number) => String(n).padStart(2, '0');
const mkYMD = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
const dayNum = (start: string, date: string) =>
  Math.floor((Date.parse(`${date}T00:00:00`) - Date.parse(`${start}T00:00:00`)) / 86400000) + 1;
const fmtLong = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const monthLabel = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });
const monthIdx = (y: number, m: number) => y * 12 + (m - 1);

type CellState = Adherence | 'cooked' | 'missed' | 'future' | 'pre';
const CELL: Record<CellState, string> = {
  followed: 'bg-brand-bg text-brand',
  partial:  'bg-amber-bg text-amber',
  deviated: 'bg-clay-bg text-clay',
  cooked:   'bg-sky-bg text-sky',
  missed:   'border border-dashed border-ink/25 text-ink-3',
  future:   'bg-cream/60 text-ink-3/40',
  pre:      'bg-cream/40 text-ink-3/30',
};

function DietaryDiary({ userId, patientName }: { userId: string; patientName: string }) {
  const [data, setData] = useState<DiaryResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);

  const load = useCallback(() => {
    api<DiaryResp>(`/api/admin/users/${userId}/diary`)
      .then(resp => {
        setData(resp);
        setSelected(prev => prev ?? resp.today);
        setView(prev => prev ?? { y: +resp.today.slice(0, 4), m: +resp.today.slice(5, 7) });
      })
      .catch(e => setErr((e as Error).message));
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  // Optimistically upsert the amended day so the panel reflects the edit at once;
  // a day with no prior activity gets a fresh row.
  const amend = async (date: string, patch: { adherence?: Adherence; remarks?: string }) => {
    try {
      await api(`/api/admin/users/${userId}/diary/${date}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setData(prev => {
        if (!prev) return prev;
        const exists = prev.rows.some(r => r.date === date);
        const rows = exists
          ? prev.rows.map(r => (r.date === date ? { ...r, ...patch, amendedByAdmin: true } : r))
          : [{
              day: dayNum(prev.startDate, date), date,
              morning: [], afternoon: [], night: [],
              adherence: null, remarks: '', amendedByAdmin: true, flagged: false, ...patch,
            } as DiaryRow, ...prev.rows];
        return { ...prev, rows };
      });
    } catch (e) { setErr((e as Error).message); }
  };

  const setProgramStart = async (value: string) => {
    try {
      await api(`/api/admin/users/${userId}/program-start`, { method: 'PATCH', body: JSON.stringify({ programStartAt: value || null }) });
      load(); // Day N and the program range shift
    } catch (e) { setErr((e as Error).message); }
  };

  const removePhoto = async (publicId: string) => {
    if (!window.confirm("Remove this photo? It's permanently deleted from the patient's kitchen.")) return;
    try {
      await api(`/api/admin/users/${userId}/photo`, { method: 'DELETE', body: JSON.stringify({ publicId }) });
      load();
    } catch (e) { setErr((e as Error).message); }
  };

  const exportCsv = () => {
    if (!data) return;
    const esc = (s: unknown) => `"${String(s).replace(/"/g, '""')}"`;
    const names = (items: DiaryItem[]) => items.map(i => i.nameEn).join('; ');
    const dayPhotos = (r: DiaryRow) => [...r.morning, ...r.afternoon, ...r.night].flatMap(i => i.photos.map(p => p.url)).join(' ');
    const head = ['Day', 'Date', 'Morning', 'Afternoon', 'Night', 'Adherence', 'Remarks', 'Photos'];
    const lines = data.rows.map(r =>
      [r.day, r.date, names(r.morning), names(r.afternoon), names(r.night), r.adherence ?? '', r.remarks, dayPhotos(r)].map(esc).join(','));
    const csv = [head.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `dietary-diary-${userId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 mt-4">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <p className="font-serif text-[15.5px] font-light text-ink tracking-tight">Dietary diary</p>
        <div className="flex items-center gap-3">
          <label className="text-[11px] text-ink/45 flex items-center gap-1.5">
            Day 1 starts
            <input type="date" value={data?.programStartAt ? dateOnly(data.programStartAt) : ''}
              onChange={e => setProgramStart(e.target.value)}
              className="text-[11.5px] border border-ink/15 rounded px-1.5 py-0.5 bg-cream text-ink" />
          </label>
          <button onClick={exportCsv} disabled={!data?.rows.length}
            className="text-[11.5px] font-medium text-ink/70 border border-ink/15 rounded px-2.5 py-1 hover:bg-cream disabled:opacity-40">
            Export CSV
          </button>
        </div>
      </div>
      <p className="text-[11.5px] text-ink/45 mb-4">
        Each day of {patientName}'s program, coloured by how closely they stuck to it. Select a day for the details.
      </p>
      {err && <p className="text-[12px] text-clay mb-3">{err}</p>}

      {!data ? (
        <p className="text-[12.5px] text-ink/45">Loading…</p>
      ) : (
        <DiaryBody
          data={data} selected={selected} view={view}
          onSelect={setSelected} onView={setView}
          onAmend={amend} onRemovePhoto={removePhoto}
        />
      )}
    </div>
  );
}

function DiaryBody({
  data, selected, view, onSelect, onView, onAmend, onRemovePhoto,
}: {
  data: DiaryResp;
  selected: string | null;
  view: { y: number; m: number } | null;
  onSelect: (ymd: string) => void;
  onView: (v: { y: number; m: number }) => void;
  onAmend: (date: string, patch: { adherence?: Adherence; remarks?: string }) => void;
  onRemovePhoto: (publicId: string) => void;
}) {
  const { startDate, today, rows } = data;
  const rowByDate = new Map(rows.map(r => [r.date, r]));
  const v = view ?? { y: +today.slice(0, 4), m: +today.slice(5, 7) };

  // Summary
  const counts = { followed: 0, partial: 0, deviated: 0 };
  let photos = 0;
  for (const r of rows) {
    if (r.adherence) counts[r.adherence]++;
    photos += [...r.morning, ...r.afternoon, ...r.night].reduce((n, i) => n + i.photos.length, 0);
  }
  const withAdh = counts.followed + counts.partial + counts.deviated;
  const onPlan = counts.followed + counts.partial;
  const totalDays = Math.max(0, dayNum(startDate, today));

  // Month grid
  const startYM = monthIdx(+startDate.slice(0, 4), +startDate.slice(5, 7));
  const todayYM = monthIdx(+today.slice(0, 4), +today.slice(5, 7));
  const curYM = monthIdx(v.y, v.m);
  const lead = new Date(v.y, v.m - 1, 1).getDay();
  const dim = new Date(v.y, v.m, 0).getDate();

  const classify = (ds: string): CellState => {
    if (ds > today) return 'future';
    if (ds < startDate) return 'pre';
    const r = rowByDate.get(ds);
    if (r?.adherence) return r.adherence;
    if (r && (r.morning.length || r.afternoon.length || r.night.length)) return 'cooked';
    return 'missed';
  };

  const step = (delta: number) => {
    const i = curYM + delta;
    onView({ y: Math.floor(i / 12), m: (i % 12) + 1 });
  };

  const selRow = selected ? rowByDate.get(selected) ?? null : null;

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-cream border border-ink/[0.08] rounded-[10px] p-3">
          <p className="text-[11px] text-ink/50 mb-2">On plan</p>
          <div className="flex h-2 rounded-full overflow-hidden bg-sand mb-2">
            {withAdh > 0 && <>
              <span className="bg-brand" style={{ flexGrow: counts.followed }} />
              <span className="bg-amber" style={{ flexGrow: counts.partial }} />
              <span className="bg-clay" style={{ flexGrow: counts.deviated }} />
            </>}
          </div>
          <p className="text-[11.5px] text-ink/55">
            {withAdh ? `${onPlan} of ${withAdh} check-ins on plan` : 'No check-ins yet'}
          </p>
        </div>
        <div className="bg-cream border border-ink/[0.08] rounded-[10px] p-3">
          <p className="text-[11px] text-ink/50 mb-1">Logged</p>
          <span className="font-serif text-[24px] font-light text-ink tabular-nums">{rows.length}</span>
          <span className="text-[12.5px] text-ink/55"> / {totalDays} days</span>
        </div>
        <div className="bg-cream border border-ink/[0.08] rounded-[10px] p-3">
          <p className="text-[11px] text-ink/50 mb-1">Photos shared</p>
          <span className="font-serif text-[24px] font-light text-ink tabular-nums">{photos}</span>
          <span className="text-[12.5px] text-ink/55"> images</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-[11px] text-ink/55">
        <Legend swatch="bg-brand-bg" label="Followed" />
        <Legend swatch="bg-amber-bg" label="Partly" />
        <Legend swatch="bg-clay-bg" label="Off plan" />
        <Legend swatch="bg-sky-bg" label="Cooked · no check-in" />
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-dashed border-ink/30" /> No entry
        </span>
        <span className="flex items-center gap-1.5"><CamIcon className="text-ink-3" /> has photos</span>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => step(-1)} disabled={curYM <= startYM} aria-label="Previous month"
          className="w-6 h-6 rounded flex items-center justify-center text-ink/60 hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent">‹</button>
        <span className="text-[13px] font-medium text-ink min-w-[130px] text-center">{monthLabel(v.y, v.m)}</span>
        <button onClick={() => step(1)} disabled={curYM >= todayYM} aria-label="Next month"
          className="w-6 h-6 rounded flex items-center justify-center text-ink/60 hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent">›</button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {WEEKDAYS.map(w => <div key={w} className="text-[10.5px] text-ink/40 text-center">{w}</div>)}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const d = i + 1;
          const ds = mkYMD(v.y, v.m, d);
          const state = classify(ds);
          const clickable = state !== 'future' && state !== 'pre';
          const r = rowByDate.get(ds);
          const hasPhotos = !!r && [...r.morning, ...r.afternoon, ...r.night].some(it => it.photos.length > 0);
          const isSel = ds === selected;
          return (
            <button key={ds} type="button" disabled={!clickable}
              onClick={() => clickable && onSelect(ds)}
              className={[
                'relative rounded-lg min-h-[52px] p-1.5 text-left transition',
                CELL[state],
                clickable ? 'cursor-pointer' : 'cursor-default',
                isSel ? 'outline outline-2 outline-ink' : (clickable ? 'hover:outline hover:outline-1 hover:outline-ink/30' : ''),
              ].join(' ')}
            >
              <span className="absolute top-1 right-1.5 text-[11px] font-medium tabular-nums">{d}</span>
              {hasPhotos && <CamIcon className="absolute bottom-1 left-1.5 text-ink-3" />}
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div className="mt-5">
        {!selected ? null
          : selected > today ? <DetailNote text={`Day ${dayNum(startDate, selected)} · ${fmtLong(selected)} — not reached yet.`} />
          : selected < startDate ? <DetailNote text={`Program starts ${fmtLong(startDate)}.`} />
          : <DayDetail key={selected} date={selected} dayN={dayNum(startDate, selected)} row={selRow}
              onAmend={patch => onAmend(selected, patch)} onRemovePhoto={onRemovePhoto} />}
      </div>
    </>
  );
}

function DayDetail({
  date, dayN, row, onAmend, onRemovePhoto,
}: {
  date: string; dayN: number; row: DiaryRow | null;
  onAmend: (patch: { adherence?: Adherence; remarks?: string }) => void;
  onRemovePhoto: (publicId: string) => void;
}) {
  const empty = !row || (!row.morning.length && !row.afternoon.length && !row.night.length);
  return (
    <div className="bg-cream border border-ink/[0.08] rounded-[12px] p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <span className="font-serif text-[17px] font-light text-ink">Day {dayN}</span>
          <span className="text-[12.5px] text-ink/55"> · {fmtLong(date)}</span>
        </div>
        {row?.amendedByAdmin && (
          <span className="text-[10px] text-ink-3 border border-ink/15 rounded-full px-2 py-0.5">edited</span>
        )}
      </div>

      {/* Adherence editor */}
      <div className="flex gap-2 mb-4">
        {(['followed', 'partial', 'deviated'] as Adherence[]).map(a => {
          const on = row?.adherence === a;
          const meta = adhMeta[a];
          return (
            <button key={a} onClick={() => onAmend({ adherence: a })}
              className={`flex-1 text-[12px] py-1.5 rounded-lg border transition ${on ? `${meta.fill} text-white border-transparent` : 'bg-bone text-ink-2 border-ink/15 hover:border-ink/30'}`}>
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Meals */}
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map(slot => {
          const items = row?.[slot.key] ?? [];
          return (
            <div key={slot.key}>
              <p className="text-[11px] text-ink/50 mb-2">{slot.label}</p>
              {items.length === 0 ? (
                <div className="border border-dashed border-ink/15 rounded-lg h-[68px] flex items-center justify-center text-ink-3 text-[12px]">—</div>
              ) : (
                items.map((it, i) => (
                  <div key={`${it.slug}-${i}`} className="mb-2.5 last:mb-0">
                    {it.photos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {it.photos.map(p => (
                          <div key={p.publicId} className="group relative">
                            <a href={p.url} target="_blank" rel="noreferrer">
                              <img src={thumb(p.url, 150, 150)} alt="" className="w-16 h-16 rounded-lg object-cover bg-ink/5" />
                            </a>
                            <button onClick={() => onRemovePhoto(p.publicId)} aria-label="Remove photo"
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ink/70 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[12.5px] text-ink flex items-center gap-1.5 leading-tight">
                      {it.nameEn}
                      {it.flagged && (
                        <span className="text-[8px] font-[800] px-1 py-0.5 rounded-full bg-amber-bg text-amber shrink-0"
                          title="Contraindicated for their conditions">!</span>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {empty && (
        <p className="text-[11.5px] text-ink/45 mt-3">
          No meals logged this day. You can still record adherence and a note above.
        </p>
      )}

      {/* Remarks */}
      <div className="mt-4">
        <p className="text-[11px] text-ink/50 mb-1.5">Reason for deviation / remarks</p>
        <textarea defaultValue={row?.remarks ?? ''} placeholder="Add a note…"
          onBlur={e => { if ((row?.remarks ?? '') !== e.target.value) onAmend({ remarks: e.target.value }); }}
          className="w-full text-[12.5px] text-ink bg-bone border border-ink/12 rounded-lg p-2.5 min-h-[54px] focus:outline-none focus:border-ink/30" />
      </div>
    </div>
  );
}

function DetailNote({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-ink/20 rounded-[12px] p-6 text-center text-[12.5px] text-ink/45">
      {text}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${swatch}`} /> {label}
    </span>
  );
}

function CamIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1-2h5l1 2h2.5A1.5 1.5 0 0 1 18 8.5v8A1.5 1.5 0 0 1 16.5 18h-12A1.5 1.5 0 0 1 3 16.5z" />
      <circle cx="10.5" cy="12" r="2.6" />
    </svg>
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
