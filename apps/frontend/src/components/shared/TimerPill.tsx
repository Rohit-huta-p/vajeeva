import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { IconClock } from './icons';

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const DONE_BORDER = 'rgba(92,173,120,0.4)';
const DONE_TEXT = 'rgba(92,173,120,0.6)';

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

  const label = done
    ? '✓ done'
    : running ? `${fmt(elapsed)} · pause`
    : elapsed > 0 ? `${fmt(elapsed)} · resume`
    : `${fmt(seconds)} · start`;

  const color = done ? DONE_TEXT : colors.cmGreen;
  return (
    <TouchableOpacity style={[s.pill, done && s.pillDone]} onPress={onToggle} disabled={done}>
      <IconClock size={13} color={color} />
      <Text style={[s.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 2, borderColor: colors.cmGreen,
    borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  pillDone: { borderColor: DONE_BORDER },
  label: { fontSize: 12, fontFamily: fonts.mono, fontWeight: '800' },
});
