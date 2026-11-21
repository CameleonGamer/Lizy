/**
 * Tiny colour helpers used by the jungle decor & glass controls.
 * Accepts #RGB, #RRGGBB, #RRGGBBAA, rgb() and rgba().
 */
type RGBA = { r: number; g: number; b: number; a: number };

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v));

export function parseColor(input: string): RGBA | null {
  const c = input.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }
  const m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  return null;
}

export function isValidHex(input: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.trim());
}

const toHex = (n: number) => Math.round(clamp(n)).toString(16).padStart(2, '0');

/** Returns the colour with the given alpha (0..1) as an rgba() string. */
export function withAlpha(color: string, alpha: number): string {
  const p = parseColor(color);
  if (!p) return color;
  return `rgba(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)}, ${clamp(alpha, 0, 1)})`;
}

/** Lightens (amount > 0) or darkens (amount < 0) a colour. amount in -1..1. */
export function shade(color: string, amount: number): string {
  const p = parseColor(color);
  if (!p) return color;
  const mix = (v: number) => (amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  return `#${toHex(mix(p.r))}${toHex(mix(p.g))}${toHex(mix(p.b))}`;
}

/** Shifts a colour toward another one (t in 0..1). */
export function blend(a: string, b: string, t: number): string {
  const pa = parseColor(a);
  const pb = parseColor(b);
  if (!pa || !pb) return a;
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return `#${toHex(lerp(pa.r, pb.r))}${toHex(lerp(pa.g, pb.g))}${toHex(lerp(pa.b, pb.b))}`;
}

/** Relative luminance (0 = black, 1 = white). */
export function luminance(color: string): number {
  const p = parseColor(color);
  if (!p) return 0;
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(p.r) + 0.7152 * ch(p.g) + 0.0722 * ch(p.b);
}
