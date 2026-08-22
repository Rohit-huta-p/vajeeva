import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Route stub owned by Jim (AUTH-WAVE-1 gate target). Dwight's OpeningScreen
// (carousel + Log in / Sign up, per prototypes/screens opening mock) replaces
// this body via re-export when it lands in src/auth/ — until then the stub
// only keeps the flow navigable.
export default function Opening() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#F2EDE1', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <Text style={{ color: '#2A251E', fontSize: 18 }}>Vajeeva</Text>
      <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
        <Text style={{ color: '#3E6B4F', fontSize: 14 }}>Log in</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/auth/signup' as any)}>
        <Text style={{ color: '#3E6B4F', fontSize: 14 }}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}
