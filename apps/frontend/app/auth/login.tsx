import { useRouter } from 'expo-router';
import LoginScreen from '../../src/auth/LoginScreen';

// Adapts the legacy react-navigation-style screen to expo-router.
export default function Login() {
  const router = useRouter();
  const navigation = {
    navigate: (route: string) => {
      if (route === 'Register') router.push('/auth/signup' as any);
      else router.push('/' as any);
    },
  };
  return <LoginScreen navigation={navigation} />;
}
