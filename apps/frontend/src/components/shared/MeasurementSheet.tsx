import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, Image, ScrollView, type LayoutChangeEvent } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconClose } from './icons';

// Physical reference photo for the app's own cup/spoon measures (katori bowls
// and spoons, each labelled with its ml/g capacity and dimensions) — bundled
// locally since it's a fixed reference asset, not per-recipe content from the
// API. GUIDE_ASPECT is the source file's real pixel proportions (838x750),
// used below to derive a display height from the measured display width.
const MEASUREMENT_GUIDE = require('../../../assets/measurement-guide.png');
const GUIDE_ASPECT = 838 / 750;

// Same Modal / scrim / panel grammar as the other bottom sheets (ChoiceSheet,
// AromaticPowderSheet) — a static image in place of interactive content.
export function MeasurementSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  // Measured, not CSS aspectRatio: React Native Web was overriding the
  // aspectRatio-derived height with the require()'d image's raw natural
  // pixel height (838x750 well past the panel's actual width) and ignoring
  // resizeMode, blowing the sheet out to the image's full pixel size with a
  // large empty gap above it. Explicit numeric width/height (RecipeGridCard
  // uses the same onLayout-measure technique) sidesteps that entirely.
  const [imgW, setImgW] = useState(0);
  const onWrapLayout = (e: LayoutChangeEvent) => setImgW(e.nativeEvent.layout.width);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>Measurements</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close} accessibilityLabel="Close">
              <IconClose size={sc(15)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            <Text style={s.caption}>What "cup" and "tsp" mean in these recipes</Text>
            <View onLayout={onWrapLayout}>
              {imgW > 0 && (
                <Image
                  source={MEASUREMENT_GUIDE}
                  style={[s.image, { width: imgW, height: imgW / GUIDE_ASPECT }]}
                  resizeMode="contain"
                  accessibilityLabel="Reference photo of the katori bowls and spoons used for cup measurements, each labelled with its capacity in ml or g and its dimensions in cm"
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  // maxHeight (not in the scaled prop set) caps the sheet on short/landscape
  // screens so it never pins the close button off-screen.
  panel: { backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '82%' },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.sand, alignSelf: 'center', marginTop: 10 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6,
  },
  title: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 14 },
  bodyContent: { paddingBottom: 22 },
  caption: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2, marginBottom: 10 },
  // width/height are set inline per-render (measured, see onWrapLayout above).
  image: { borderRadius: 12, backgroundColor: colors.sand },
});
