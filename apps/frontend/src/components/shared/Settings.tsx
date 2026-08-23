import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { IconChev } from './icons';

// Grouped-settings primitives (ref: prototypes/explorations/vajeeva-profile-production.html).
// One card = one SettingsGroup; each SettingsRow is icon · label · right, where
// right is a value+chevron, a custom node (e.g. a toggle), or nothing. Rows
// self-divide — the group injects `first` so the top row skips its divider.

export function SettingsGroup({ children, flush }: { children: React.ReactNode; flush?: boolean }) {
  const rows = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <View style={[s.group, flush && s.groupFlush]}>
      {rows.map((row, i) =>
        React.cloneElement(row as React.ReactElement<{ first?: boolean }>, { first: i === 0 }))}
    </View>
  );
}

export function SettingsRow({
  icon, label, value, right, onPress, danger, first,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  first?: boolean;
}) {
  const body = (
    <View style={[s.row, !first && s.rowDivider]}>
      <View style={[s.ico, danger && s.icoDanger]}>{icon}</View>
      <Text style={[s.label, danger && s.labelDanger]} numberOfLines={1}>{label}</Text>
      <View style={s.right}>
        {right ?? (
          <>
            {value ? <Text style={s.value}>{value}</Text> : null}
            {onPress ? <IconChev size={sc(15)} color={colors.muted} /> : null}
          </>
        )}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={label}>
      {body}
    </TouchableOpacity>
  );
}

export function SettingsToggle({ value, onValueChange }: {
  value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: colors.green, false: colors.line2 }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.line2}
    />
  );
}

const s = scaledSheet({
  group: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 14, marginHorizontal: 14, overflow: 'hidden', ...shadows.card,
  },
  groupFlush: { marginHorizontal: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  ico: {
    width: 29, height: 29, borderRadius: 8, backgroundColor: colors.sand,
    alignItems: 'center', justifyContent: 'center',
  },
  icoDanger: { backgroundColor: colors.claySoft },
  label: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '600', color: colors.ink },
  labelDanger: { color: colors.clay },
  right: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  value: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.muted },
});
