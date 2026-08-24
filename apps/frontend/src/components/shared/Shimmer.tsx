import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Reusable skeleton shimmer: renders its children (placeholder blocks) and
 * sweeps a soft light band across them on a loop. The caller's `style` should
 * include `overflow: 'hidden'` so the sweep is clipped to the shape's corners.
 * Theme-aware — the sheen flips for the dark palette.
 */
export function Shimmer({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const { scheme } = useTheme();
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (w === 0) return;
    const anim = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [x, w]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-w, w] });
  const sheen = scheme === 'dark' ? 'rgba(240,234,216,0.10)' : 'rgba(255,255,255,0.6)';

  return (
    <View style={style} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {children}
      {w > 0 && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', sheen, 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={styles.fill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
