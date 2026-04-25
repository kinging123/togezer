import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Logo } from '@/components/Logo'
import { BorderWidths, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme'

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>

        <View style={styles.top}>
          <Logo size={24} />

          <Text style={styles.headline}>
            {'habits,\nbut with\nthe '}
            <Text style={styles.headlineAccent}>gang</Text>
            {'.'}
          </Text>

          <View>
            <Text style={styles.body}>check in once a day.</Text>
            <Text style={styles.body}>see your friends show up too.</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.btnPrimaryText}>get started</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.btnSecondaryText}>i already have an account</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  )
}

const HEADLINE_SIZE = 48

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.s6,
    paddingTop: Spacing.s8,
    paddingBottom: Spacing.s6,
    justifyContent: 'space-between',
  },

  // ── Top section ──────────────────────────────────────────────
  top: {
    gap: Spacing.s6,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: HEADLINE_SIZE,
    lineHeight: HEADLINE_SIZE * 0.88,
    letterSpacing: -(HEADLINE_SIZE * 0.04),
    color: Colors.ink,
  },
  headlineAccent: {
    color: Colors.red,
    fontStyle: 'italic',
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lead,
    lineHeight: FontSizes.lead * 1.4,
    color: Colors.ink2,
    letterSpacing: -0.2,
  },

  // ── Bottom section ────────────────────────────────────────────
  bottom: {
    gap: Spacing.s3,
  },
  btnPrimary: {
    backgroundColor: Colors.red,
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: `2px 2px 0 0 ${Colors.ink}` } as object,
      default: Shadows.hardSm,
    }),
  },
  btnPrimaryPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...Platform.select({
      web: { boxShadow: 'none' } as object,
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  btnPrimaryText: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.body,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  btnSecondary: {
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink2,
    borderStyle: 'dashed',
    borderRadius: Radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSecondaryPressed: {
    backgroundColor: Colors.bg2,
  },
  btnSecondaryText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.ink2,
    letterSpacing: -0.1,
  },
})

