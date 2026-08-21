import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, AppState } from 'react-native';
import { colors } from '../theme';

function parseMMSS(str: string): number {
  const parts = str.split(':');
  if (parts.length !== 2) return 0;
  const mm = parseInt(parts[0], 10);
  const ss = parseInt(parts[1], 10);
  if (Number.isNaN(mm) || Number.isNaN(ss)) return 0;
  return (mm * 60 + ss) * 1000;
}

function fmtMMSS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface Props { timerStr: string; }

export default function TimerPill({ timerStr }: Props) {
  const initial = parseMMSS(timerStr);
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    setRemaining(parseMMSS(timerStr));
    setRunning(false);
    wasRunningRef.current = false;
  }, [timerStr]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (wasRunningRef.current) setRunning(true);
      } else {
        wasRunningRef.current = running;
        setRunning(false);
      }
    });
    return () => sub.remove();
  }, [running]);

  const toggle = useCallback(() => {
    if (remaining <= 0) { setRemaining(initial); setRunning(false); wasRunningRef.current = false; return; }
    setRunning(r => { const next = !r; wasRunningRef.current = next; return next; });
  }, [remaining, initial]);

  const done = remaining <= 0;
  return (
    <TouchableOpacity style={[s.pill, done && s.done]} onPress={toggle} activeOpacity={0.8}>
      <Text style={[s.icon, done && s.doneText]}>{done ? '✓' : running ? '⏸' : '▶'}</Text>
      <Text style={[s.time, done && s.doneText]}>{fmtMMSS(remaining)}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 7,
              borderWidth: 2, borderColor: colors.cmGreen, borderRadius: 999,
              paddingHorizontal: 14, paddingVertical: 8 },
  done:     { borderColor: 'rgba(92,173,120,0.4)' },
  icon:     { fontSize: 13, color: colors.cmGreen, fontWeight: '800' },
  time:     { fontSize: 13, color: colors.cmGreen, fontWeight: '800', fontVariant: ['tabular-nums'] },
  doneText: { color: 'rgba(92,173,120,0.6)' },
});
