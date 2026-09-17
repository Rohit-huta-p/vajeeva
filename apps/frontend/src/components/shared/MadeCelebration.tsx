import React, { useEffect, useRef, useState } from 'react';
import { Modal, Text, Pressable, Animated, Easing, AccessibilityInfo } from 'react-native';
import LottieView from 'lottie-react-native';
import { fonts } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { IconCheck } from './icons';

// Self-contained animation (images embedded as base64) so it bundles + plays offline.
const CELEBRATION = require('../../../assets/lottie/made-celebration.json');

/**
 * Full-screen celebration shown when a patient logs "I made this" — a Lottie
 * flourish over a warm, health-affirming line. Auto-dismisses when the animation
 * ends (with a timeout fallback); tap anywhere to dismiss early; honours reduce-motion.
 */
export function MadeCelebration({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(fade, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => { closing.current = false; onClose(); });
  };

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // Fallback dismiss in case onAnimationFinish doesn't fire (e.g. on web).
    const t = setTimeout(dismiss, reduceMotion ? 3400 : 5200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Pressable style={s.root} onPress={dismiss} accessibilityLabel="Dismiss">
        <Animated.View style={[s.inner, { opacity: fade }]}>
          {reduceMotion ? (
            <Animated.View style={s.ring}><IconCheck size={sc(38)} color="#fff" /></Animated.View>
          ) : (
            <LottieView
              source={CELEBRATION}
              autoPlay
              loop
              style={s.lottie}
            />
          )}
          <Text style={s.title}>Getting healthier, one dish at a time.</Text>
          <Text style={s.sub}>Lovely work — now enjoy your meal.</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = scaledSheet({
  root: {
    flex: 1, backgroundColor: 'rgba(18,16,13,0.86)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34,
  },
  inner: { alignItems: 'center', gap: 6 },
  lottie: { width: 240, height: 240 },
  ring: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#5CAD78',
    backgroundColor: 'rgba(92,173,120,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  title: {
    fontSize: 19, fontFamily: fonts.serif, fontWeight: '700', color: '#F4EFE4',
    textAlign: 'center', lineHeight: 25, letterSpacing: -0.2,
  },
  sub: { fontSize: 13, fontFamily: fonts.sans, color: 'rgba(244,239,228,0.72)', textAlign: 'center', marginTop: 2 },
});
