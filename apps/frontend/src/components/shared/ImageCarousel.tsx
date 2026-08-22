import React, { useState } from 'react';
import { View, Image, FlatList, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import type { RecipeImage } from '../../api/recipes';

// Horizontal paged photo strip with dot indicators (RN core Image only).
// Renders nothing when images is empty — the caller keeps its SVG fallback,
// so a recipe without photos never shows a broken image.
export function ImageCarousel({ images, height, radius = 0, placeholderColor }: {
  images: RecipeImage[];
  /** already-scaled (sc'd) height in pt */
  height: number;
  /** already-scaled corner radius, matches the host container */
  radius?: number;
  /** surface shown while images load — match the host theme (default sand) */
  placeholderColor?: string;
}) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  if (!images.length) return null;

  // Track the page from scroll offset (momentum-end alone is unreliable on web).
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View
      style={[s.wrap, { height, borderRadius: radius }, placeholderColor ? { backgroundColor: placeholderColor } : null]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(im, i) => `${im.url}-${i}`}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              accessibilityLabel={item.alt}
              style={{ width, height }}
              resizeMode="cover"
            />
          )}
        />
      )}
      {images.length > 1 && (
        <View style={s.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View key={i} style={[s.dot, i === page && s.dotOn]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = scaledSheet({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  dots: {
    position: 'absolute', bottom: 7, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(251,248,241,0.55)',
  },
  dotOn: { backgroundColor: colors.cream },
});
