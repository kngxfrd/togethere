import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/login" />;
}