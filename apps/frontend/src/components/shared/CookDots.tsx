import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

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

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cmSurf2 },
  current: { width: 20, backgroundColor: colors.cmAmber },
  done: { backgroundColor: colors.cmGreenDim },
});
