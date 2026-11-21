import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useGlassMode } from '@/components/glass/glassMode';
import { withAlpha } from '@/core/theme/color';

export default function TabsLayout() {
  const { currentTheme, leafColor } = useThemeStore();
  const glassMode = useGlassMode();
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
          backgroundColor:
            glassMode === 'solid'
              ? currentTheme.colors.surface
              : glassMode === 'native'
                ? 'transparent'
                : currentTheme.colors.surfaceGlass,
          borderTopColor: glassMode === 'native' ? 'transparent' : currentTheme.colors.borderGlass,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: glassMode === 'native' ? 0 : 12,
        },
        tabBarBackground: () => {
          if (glassMode === 'solid') return null;
          if (glassMode === 'native') {
            // Real iOS 26 Liquid Glass, lightly tinted with the foliage colour.
            return (
              <GlassView
                glassEffectStyle="regular"
                tintColor={withAlpha(leafColor, 0.12)}
                colorScheme="dark"
                style={StyleSheet.absoluteFill}
              />
            );
          }
          return (
            <View style={StyleSheet.absoluteFill}>
              <BlurView tint="dark" intensity={45} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(255,255,255,0.10)', 'transparent']}
                locations={[0, 0.5]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>
          );
        },
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
