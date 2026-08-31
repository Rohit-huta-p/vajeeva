import React from 'react';
import { View, Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { useOffline } from '../../offline/OfflineProvider';
import { scaledSheet } from '../../theme/scale';

// Slim top bar shown ONLY while the device has no internet. It states the offline
// status and, in a pill, tells the user how to sync: just turn connectivity back
// on. There is no manual sync button anywhere — the moment the device is back
// online, OfflineProvider re-syncs automatically (offline→online transition) and
// this bar disappears. Reconnecting IS the sync.
export function OfflineBanner() {
  const { isOnline } = useOffline();
  const s = useThemedStyles(makeStyles);
  if (isOnline) return null;
  return (
    <View style={s.bar} accessibilityRole="alert">
      <View style={s.dot} />
      <Text style={s.status}>You’re in offline mode</Text>
      <View style={s.pill}>
        <Text style={s.pillText}>Turn on Wi‑Fi or mobile data to sync</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  bar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.sand,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.clay },
  status: { fontSize: 11, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  pill: {
    marginLeft: 'auto',
    backgroundColor: colors.cream, borderRadius: 999, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  pillText: { fontSize: 9.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber2 },
});
