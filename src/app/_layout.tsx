import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../hooks/useAuth';
import { RideProvider } from '@/contexts/RideContext';

const DEFAULT_THEME_KEY = 'theme:default-applied';

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    (async () => {
      const alreadyApplied = await AsyncStorage.getItem(DEFAULT_THEME_KEY);
      if (!alreadyApplied) {
        // First-ever launch: force light regardless of system setting.
        setColorScheme('light');
        await AsyncStorage.setItem(DEFAULT_THEME_KEY, 'true');
      }
      // If already applied, do nothing — respect whatever the user
      // last chose via the Settings toggle.
    })();
  }, []);

  return (
    <AuthProvider>
      <RideProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </RideProvider>
    </AuthProvider>
  );
}