import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  BookOpen, 
  Calendar, 
  BarChart2, 
  MessageSquare, 
  Trophy 
} from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';

export default function TabsLayout() {
  const { currentTheme } = useThemeStore();
  const insets = useSafeAreaInsets();

  // Ensure bottom bar never collides with Android 3-button navigation or iOS home indicator
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 28);
  const barHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: currentTheme.colors.primary,
        tabBarInactiveTintColor: currentTheme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          backgroundColor: currentTheme.colors.surfaceGlass,
          borderTopColor: currentTheme.colors.borderGlass,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 12,
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={45}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'Devoirs',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color, size }) => <Calendar size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Trophy size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
