// The patient's LOCAL calendar day + meal slot — computed on-device so the dietary
// diary's "which day / which meal" matches what the patient experienced, regardless
// of server timezone. See docs/specs/2026-09-20-dietary-diary.md.

/** Patient-local calendar day as 'YYYY-MM-DD' — the diary day bucket. */
export const localYMD = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export type MealSlot = 'morning' | 'afternoon' | 'night';

/** Default meal slot from local time (patient can override). */
export const slotFromDate = (d: Date = new Date()): MealSlot => {
  const h = d.getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'night';
};
