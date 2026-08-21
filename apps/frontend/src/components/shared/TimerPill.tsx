import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function TimerPill({ seconds, running, onToggle, done }: {
  seconds: number; running: boolean; onToggle: () => void; done: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    else if (ref.current) clearInterval(ref.current);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const label = done ? '✓ done' : running ? `⏸ ${fmt(elapsed)}` : elapsed > 0 ? `▶ ${fmt(elapsed)}` : `▶ ${fmt(seconds)}`;
  return (
    <TouchableOpacity style={s.pill} onPress={onToggle} disabled={done}>
      <Text style={[s.label, done && s.done]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    borderWidth: 2, borderColor: colors.cmGreen,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12, fontFamily: fonts.mono, color: colors.cmGreen },
  done: { opacity: 0.6 },
});
