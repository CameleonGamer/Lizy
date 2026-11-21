import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { useGamingStore } from '@/stores/useGamingStore';
import { useSecurityStore } from '@/stores/useSecurityStore';
import { AppLockModal } from '@/components/security/AppLockModal';

export default function RootLayout() {
  const { currentTheme } = useThemeStore();
  const recordDailyActivity = useGamingStore((s) => s.recordDailyActivity);
  const { loadSecuritySettings, lockApp } = useSecurityStore();
  const [isBackgrounded, setIsBackgrounded] = useState(false);

  useEffect(() => {
    // Record streak / daily login on app boot
    recordDailyActivity();
    // Load hardware security settings (PIN & Privacy Shield)
    loadSecuritySettings();

    // AppState listener for privacy shield and auto-lock
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const inBackground = nextAppState === 'background' || nextAppState === 'inactive';
      setIsBackgrounded(inBackground);
      if (inBackground) {
        lockApp();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: currentTheme.colors.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>

          {/* Hardware Security Lock & Multi-tasking Privacy Shield */}
          <AppLockModal isBackgrounded={isBackgrounded} />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
