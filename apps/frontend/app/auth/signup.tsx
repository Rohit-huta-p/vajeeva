import { useRouter } from 'expo-router';
import RegisterScreen from '../../src/auth/RegisterScreen';

// Adapts the legacy react-navigation-style screen to expo-router.
export default function Signup() {
  const router = useRouter();
  const navigation = {
    navigate: (route: string) => {
      if (route === 'Login') router.push('/auth/login' as any);
      else router.push('/' as any);
    },
  };
  return <RegisterScreen navigation={navigation} />;
}
