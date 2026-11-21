import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, RotateCcw } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { isValidHex, luminance } from '@/core/theme/color';

interface ColorPickerProps {
  label: string;
  description?: string;
  value: string;
  swatches: string[];
  onChange: (color: string) => void;
  /** Shows a "default" chip when provided. */
  onReset?: () => void;
  /** True when the value is the default one (highlights the reset chip). */
  isDefault?: boolean;
}

/** Swatches + free hex input. */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  description,
  value,
  swatches,
  onChange,
  onReset,
  isDefault,
}) => {
  const colors = useThemeStore((s) => s.currentTheme.colors);
  const [draft, setDraft] = useState(value.toUpperCase());

  useEffect(() => setDraft(value.toUpperCase()), [value]);

  const pick = (c: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onChange(c);
  };

  const commitDraft = () => {
    const hex = draft.startsWith('#') ? draft : `#${draft}`;
    if (isValidHex(hex)) {
      onChange(hex.toUpperCase());
    } else {
      setDraft(value.toUpperCase());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={[styles.preview, { backgroundColor: value, borderColor: colors.borderGlass }]} />
        <View style={styles.labelTexts}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
        </View>
      </View>

      <View style={styles.swatches}>
        {onReset && (
          <TouchableOpacity
            onPress={onReset}
            accessibilityLabel={`${label} : valeur par défaut`}
            style={[
              styles.resetChip,
              { borderColor: isDefault ? colors.primary : colors.borderGlass },
            ]}
          >
            <RotateCcw size={14} color={isDefault ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        )}
        {swatches.map((c) => {
          const selected = !isDefault && c.toLowerCase() === value.toLowerCase();
          return (
            <TouchableOpacity
              key={c}
              onPress={() => pick(c)}
              accessibilityLabel={`${label} ${c}`}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.15)' },
              ]}
            >
              {selected && <Check size={14} color={luminance(c) > 0.5 ? '#000000' : '#FFFFFF'} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        value={draft}
        onChangeText={(t) => setDraft(t.toUpperCase())}
        onEndEditing={commitDraft}
        onSubmitEditing={commitDraft}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={7}
        placeholder="#RRGGBB"
        placeholderTextColor={colors.textMuted}
        style={[styles.hexInput, { color: colors.text, borderColor: colors.borderGlass }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  labelTexts: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  desc: {
    fontSize: 11,
    marginTop: 2,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
