import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { IconCheck } from './icons';
import type { HealthFlag } from '../../hooks/useHealthFlags';

// The condition checkbox grid (ref: prototypes/screens/onboarding.html .ob-grid).
// Presentational + controlled — shared by the onboarding step and the Settings
// health-profile sheet so the two stay pixel-identical.
export function HealthFlagGrid({ flags, selected, onToggle }: {
  flags: HealthFlag[];
  selected: Set<string>;
  onToggle: (code: string) => void;
}) {
  return (
    <View style={s.grid}>
      {flags.map(f => {
        const on = selected.has(f.code);
        return (
          <TouchableOpacity
            key={f.code}
            style={[s.card, on && s.cardOn]}
            onPress={() => onToggle(f.code)}
            activeOpacity={0.85}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={f.label}
          >
            <View style={[s.check, on && s.checkOn]}>
              {on ? <IconCheck size={sc(11)} color="#FFFFFF" /> : null}
            </View>
            <View style={s.body}>
              <Text style={s.name}>{f.label}</Text>
              {f.description ? <Text style={s.note}>{f.description}</Text> : null}
            </View>
            <Text style={s.code}>{f.code}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = scaledSheet({
  grid: { gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, paddingVertical: 11, paddingHorizontal: 12, ...shadows.card,
  },
  cardOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  check: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.green },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  note: { fontSize: 9, fontFamily: fonts.sans, color: colors.ink2, marginTop: 1, lineHeight: 13 },
  code: { fontSize: 8.5, fontFamily: fonts.mono, color: colors.muted },
});
