import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

const DONE_BG = 'rgba(92,173,120,0.5)';

export function CookDots({ total, current, onJump }: {
  total: number; current: number; onJump: (i: number) => void;
}) {
  return (
    <View style={s.row}>
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        return (
          <TouchableOpacity
            key={i}
            style={[
              s.dot,
              isCurrent && s.current,
              isDone && s.done,
            ]}
            onPress={() => { if (i <= current) onJump(i); }}
            disabled={i > current}
          />
        );
      })}
    </View>
  );
}

const s = scaledSheet({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cmSurf2 },
  current: { width: 20, backgroundColor: colors.cmAmber },
  done: { backgroundColor: DONE_BG },
});
