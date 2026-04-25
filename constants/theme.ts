export const Colors = {
  // Backgrounds
  bg: '#F5F1E8',
  bg2: '#EDE7D7',

  // Ink
  ink: '#17150F',
  ink2: '#3A362E',
  ink3: '#7A7466',

  // Border
  line: '#D9D1BD',

  // Accent
  red: '#FF4A1C',
  redInk: '#C2360F',

  // Palette
  yolk: '#FFC93C',
  mint: '#9DE88B',
  sky: '#A9D0FF',
  lilac: '#C8B8FF',
  pink: '#FFB3C7',

  // Avatar identity colors (index-stable)
  avatarColors: ['#FFC93C', '#9DE88B', '#A9D0FF', '#C8B8FF', '#FFB3C7', '#FFD7A8'],

  // Dark mode overrides
  dark: {
    bg: '#17150F',
    bg2: '#1F1D16',
    ink: '#F5F1E8',
    ink2: '#D9D1BD',
    ink3: '#8A8271',
    line: '#3A362E',
  },
} as const

export const Fonts = {
  display: 'SpaceGrotesk_700Bold',
  displaySemiBold: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'SpaceGrotesk_400Regular',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const

export const FontSizes = {
  // Type scale
  display: 56,   // clamp handled per-component
  h1: 56,
  h2: 36,
  h3: 24,
  lead: 20,
  body: 16,
  small: 14,
  label: 11,     // mono, uppercase, tracked
  xs: 10,
} as const

export const LineHeights = {
  display: 0.88,
  h1: 0.95,
  h2: 1,
  h3: 1.1,
  lead: 1.4,
  body: 1.55,
  small: 1.45,
} as const

export const LetterSpacing = {
  display: -2.24,  // -0.04em × 56px
  h1: -1.68,       // -0.03em × 56px
  h2: -0.9,        // -0.025em × 36px
  h3: -0.36,       // -0.015em × 24px
  label: 1.1,      // +0.1em × 11px
} as const

export const Radii = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  pill: 999,
} as const

export const Spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
} as const

// Hard Swiss-style shadows — translated to React Native shadow props
export const Shadows = {
  hard: {
    shadowColor: '#17150F',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  hardSm: {
    shadowColor: '#17150F',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  soft: {
    shadowColor: '#17150F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const

export const BorderWidths = {
  hairline: 1,
  default: 2,
  thick: 3,
} as const
