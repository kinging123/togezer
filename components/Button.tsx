import { Platform, Pressable, StyleSheet, Text } from 'react-native'
import { BorderWidths, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type Props = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && !disabled && variant === 'primary' && styles.primaryPressed,
        pressed && !disabled && variant !== 'primary' && styles.softPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'ghost' && styles.ghostLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.pill,
    alignItems: 'center',
  },

  // ── Primary ───────────────────────────────────────────────────
  primary: {
    backgroundColor: Colors.red,
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink,
    paddingVertical: 15,
    ...Platform.select({
      web: { boxShadow: `2px 2px 0 0 ${Colors.ink}` } as object,
      default: Shadows.hardSm,
    }),
  },
  primaryPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...Platform.select({
      web: { boxShadow: 'none' } as object,
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  primaryLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.body,
    color: Colors.ink,
    letterSpacing: -0.2,
  },

  // ── Secondary (dashed ink — email / prominent outline) ────────
  secondary: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    paddingVertical: 13,
  },
  secondaryLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.ink,
    letterSpacing: -0.2,
  },

  // ── Ghost (dashed ink2 — muted secondary action) ──────────────
  ghost: {
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink2,
    borderStyle: 'dashed',
    paddingVertical: 13,
  },
  ghostLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.ink2,
    letterSpacing: -0.1,
  },

  // ── Shared pressed state for non-primary ──────────────────────
  softPressed: {
    backgroundColor: Colors.bg2,
  },

  disabled: {
    opacity: 0.4,
  },

  label: {},
})
