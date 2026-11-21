import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

const OUTER_KEYS = new Set<string>([
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'marginStart', 'marginEnd',
  'position', 'top', 'bottom', 'left', 'right', 'start', 'end', 'zIndex',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'aspectRatio',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
  'transform',
]);

/**
 * Splits a style in two: what positions the element in its parent (outer)
 * and what styles its own box & children layout (inner). Lets a component
 * wrap its body (to add an animated / decorated shell) without breaking the
 * layout callers already rely on.
 */
export function splitStyle(style: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    (OUTER_KEYS.has(key) ? outer : inner)[key] = flat[key];
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}
