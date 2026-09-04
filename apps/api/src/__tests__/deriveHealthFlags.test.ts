import { deriveFlags, mergeFlags, type Rule, type Flag } from '../lib/deriveHealthFlags';

const RULES: Rule[] = [
  { ingredient: 'Jaggery', match: ['jaggery', 'gur'], effects: [{ condition: 'diabetes', severity: 'avoid' }, { condition: 'obesity', severity: 'caution' }] },
  { ingredient: 'Amla',    match: ['amla'],           effects: [{ condition: 'diabetes', severity: 'indication' }] },
  { ingredient: 'Milk',    match: ['milk', 'ghee'],   effects: [{ condition: 'lactose-intolerance', severity: 'avoid' }], enabled: false },
];

describe('deriveFlags', () => {
  it('flags a recipe from its ingredient names', () => {
    const f = deriveFlags([{ nameEn: 'Jaggery' }, { nameEn: 'Rice flour' }], RULES);
    expect(f).toContainEqual({ condition: 'diabetes', severity: 'avoid', note: '', source: 'rule' });
    expect(f).toContainEqual({ condition: 'obesity', severity: 'caution', note: '', source: 'rule' });
  });

  it('a contraindication beats an indication for the same condition (safety first)', () => {
    const f = deriveFlags([{ nameEn: 'Jaggery' }, { nameEn: 'Amla powder' }], RULES);
    const diabetes = f.filter(x => x.condition === 'diabetes');
    expect(diabetes).toHaveLength(1);
    expect(diabetes[0].severity).toBe('avoid');
  });

  it('emits indication when nothing contraindicates', () => {
    const f = deriveFlags([{ nameEn: 'Amla' }], RULES);
    expect(f).toContainEqual({ condition: 'diabetes', severity: 'indication', note: '', source: 'rule' });
  });

  it('ignores disabled rules and non-matching ingredients', () => {
    expect(deriveFlags([{ nameEn: 'Milk' }], RULES)).toHaveLength(0);   // Milk rule disabled
    expect(deriveFlags([{ nameEn: 'Water' }], RULES)).toHaveLength(0);
  });
});

describe('mergeFlags', () => {
  it('preserves a manual override and adds fresh derived flags', () => {
    const existing: Flag[] = [{ condition: 'diabetes', severity: 'safe', note: 'sugar substitute', source: 'manual' }];
    const derived: Flag[] = [
      { condition: 'diabetes', severity: 'avoid', note: '', source: 'rule' },
      { condition: 'obesity', severity: 'caution', note: '', source: 'rule' },
    ];
    const m = mergeFlags(existing, derived);
    const diabetes = m.next.filter(f => f.condition === 'diabetes');
    expect(diabetes).toHaveLength(1);
    expect(diabetes[0].severity).toBe('safe');   // manual wins
    expect(m.next).toContainEqual(expect.objectContaining({ condition: 'obesity', severity: 'caution', source: 'rule' }));
    expect(m.added).toBe(1);
  });

  it('is idempotent for unchanged rule flags', () => {
    const flags: Flag[] = [{ condition: 'diabetes', severity: 'avoid', note: '', source: 'rule' }];
    const m = mergeFlags(flags, [{ condition: 'diabetes', severity: 'avoid', note: '', source: 'rule' }]);
    expect(m.dirty).toBe(false);
    expect(m.added + m.changed + m.removed).toBe(0);
  });

  it('counts changed and removed rule flags', () => {
    const existing: Flag[] = [
      { condition: 'diabetes', severity: 'caution', note: '', source: 'rule' },
      { condition: 'obesity', severity: 'caution', note: '', source: 'rule' },
    ];
    const m = mergeFlags(existing, [{ condition: 'diabetes', severity: 'avoid', note: '', source: 'rule' }]);
    expect(m.changed).toBe(1); // diabetes caution → avoid
    expect(m.removed).toBe(1); // obesity no longer derived
  });

  it('normalises a legacy flag (no source) to manual', () => {
    const existing = [{ condition: 'gluten', severity: 'avoid', note: '' }] as unknown as Flag[];
    const m = mergeFlags(existing, []);
    expect(m.next[0].source).toBe('manual');
    expect(m.dirty).toBe(false);
  });
});
