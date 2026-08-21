import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props { isSaved: boolean; onPress: () => void; }

export default function SaveButton({ isSaved, onPress }: Props) {
  return (
    <TouchableOpacity style={[s.btn, isSaved && s.saved]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.label, isSaved && s.savedLabel]}>{isSaved ? '♥ Saved' : '♡ Save'}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn:       { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
               borderWidth: 1.5, borderColor: colors.green },
  saved:     { backgroundColor: colors.green },
  label:     { fontSize: 14, fontWeight: '700', color: colors.green },
  savedLabel: { color: colors.cream },
});
