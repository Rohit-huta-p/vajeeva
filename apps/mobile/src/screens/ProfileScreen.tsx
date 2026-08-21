import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../auth/AuthContext';
import { colors } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  return (
    <View style={s.root}>
      <Text style={s.heading}>Profile</Text>
      <Text style={s.email}>{user?.email}</Text>
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bone, padding: 24, gap: 16 },
  heading:    { fontSize: 22, fontWeight: '800', color: colors.ink },
  email:      { fontSize: 15, color: colors.ink2 },
  logoutBtn:  { backgroundColor: colors.sand, borderRadius: 14, padding: 14, alignItems: 'center',
                borderWidth: 1, borderColor: colors.line },
  logoutText: { color: colors.clay, fontWeight: '700' },
});
