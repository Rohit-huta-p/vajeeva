import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from './AuthContext';
type LoginScreenProps = { navigation: { navigate: (route: string) => void } };
import { colors } from '../theme';

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert('Login failed', e?.response?.data?.error ?? 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <Text style={s.title}>Vajeeva</Text>
      <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.muted}
        value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor={colors.muted}
        value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.cream} /> : <Text style={s.btnText}>Sign In</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>No account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bone, justifyContent: 'center', padding: 24, gap: 12 },
  title:   { fontFamily: 'serif', fontSize: 32, color: colors.ink, textAlign: 'center', marginBottom: 16 },
  input:   { backgroundColor: colors.sand, borderRadius: 10, padding: 14, color: colors.ink, fontSize: 15 },
  btn:     { backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText: { color: colors.cream, fontWeight: '800', fontSize: 15 },
  link:    { color: colors.green, textAlign: 'center', marginTop: 8, fontSize: 14 },
});
