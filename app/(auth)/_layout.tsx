import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';

export default function AuthLayout() {
  const { currentTheme } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: currentTheme.colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
