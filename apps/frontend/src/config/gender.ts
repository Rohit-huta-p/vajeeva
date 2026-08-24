// Shared gender options — mirror the signup step (auth/RegisterScreen) and the
// API's User.gender enum, so the signup flow and the profile editor agree.
export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/** Display label for a stored gender code (undefined when unset/unknown). */
export const genderLabel = (value?: string): string | undefined =>
  GENDER_OPTIONS.find(o => o.value === value)?.label;
