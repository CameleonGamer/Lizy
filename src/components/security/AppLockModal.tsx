import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSecurityStore } from '@/stores/useSecurityStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Lock, Delete, ShieldAlert, Sparkles } from 'lucide-react-native';

interface AppLockModalProps {
  isBackgrounded: boolean;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ isBackgrounded }) => {
  const { currentTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    isLockEnabled, 
    isPrivacyShieldEnabled, 
    isAppLocked, 
    verifyPin, 
    pinLength 
  } = useSecurityStore();

  const [enteredPin, setEnteredPin] = useState('');
  const [hasError, setHasError] = useState(false);

  // Reset entered PIN when lock state changes
  useEffect(() => {
    if (isAppLocked) {
      setEnteredPin('');
      setHasError(false);
    }
  }, [isAppLocked]);

  const handleKeyPress = async (digit: string) => {
    if (enteredPin.length >= pinLength) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const newPin = enteredPin + digit;
    setEnteredPin(newPin);
    setHasError(false);

    if (newPin.length === pinLength) {
      const isValid = await verifyPin(newPin);
      if (isValid) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        setEnteredPin('');
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setHasError(true);
        setTimeout(() => {
          setEnteredPin('');
          setHasError(false);
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEnteredPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  // Case 1: App is backgrounded & Privacy Shield is enabled -> show blind shield
  if (isBackgrounded && (isPrivacyShieldEnabled || isLockEnabled)) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.shieldContainer]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.shieldContent}>
          <View style={[styles.shieldIconCircle, { backgroundColor: currentTheme.colors.primary }]}>
            <Lock size={36} color="#FFFFFF" />
          </View>
          <Text style={[styles.shieldTitle, { color: currentTheme.colors.text }]}>
            Lizy Sécurisé
          </Text>
          <Text style={[styles.shieldSubtitle, { color: currentTheme.colors.textMuted }]}>
            Protection anti-regard & confidentialité active
          </Text>
        </View>
      </View>
    );
  }

  // Case 2: App is foregrounded but locked -> show PIN entry keypad
  if (isAppLocked && isLockEnabled) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.lockContainer, { backgroundColor: currentTheme.colors.background }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.lockContent}>
          {/* Header */}
          <View style={[styles.shieldIconCircle, { backgroundColor: currentTheme.colors.primary }]}>
            <Lock size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.welcomeText, { color: currentTheme.colors.text }]}>
            {user?.name ? `Bonjour, ${user.name}` : 'Espace Sécurisé'}
          </Text>
          <Text style={[styles.instructionText, { color: hasError ? currentTheme.colors.danger : currentTheme.colors.textMuted }]}>
            {hasError ? 'Code PIN incorrect, réessayez' : 'Saisissez votre code PIN Lizy'}
          </Text>

          {/* PIN Dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: pinLength }).map((_, idx) => {
              const isFilled = idx < enteredPin.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      borderColor: hasError 
                        ? currentTheme.colors.danger 
                        : isFilled 
                          ? currentTheme.colors.primary 
                          : currentTheme.colors.borderGlass,
                      backgroundColor: hasError 
                        ? currentTheme.colors.danger 
                        : isFilled 
                          ? currentTheme.colors.primary 
                          : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Numeric Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((key, kIdx) => {
                  if (key === '') {
                    return <View key={kIdx} style={styles.keypadKeyPlaceholder} />;
                  }
                  if (key === 'del') {
                    return (
                      <TouchableOpacity
                        key={kIdx}
                        onPress={handleDelete}
                        style={[styles.keypadKey, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}
                        activeOpacity={0.7}
                      >
                        <Delete size={22} color={currentTheme.colors.text} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={kIdx}
                      onPress={() => handleKeyPress(key)}
                      style={[styles.keypadKey, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.keyText, { color: currentTheme.colors.text }]}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  shieldContainer: {
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  shieldIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  shieldTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  shieldSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  lockContainer: {
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 36,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  keypadKey: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyPlaceholder: {
    flex: 1,
    height: 64,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
  },
});
