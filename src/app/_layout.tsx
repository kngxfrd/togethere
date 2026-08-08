import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../hooks/useAuth';
import { RideProvider } from '@/contexts/RideContext';

export default function RootLayout() {
  return (
    <RideProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
    </RideProvider>
  );
}