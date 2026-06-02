import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>

        <View style={styles.middle}>
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
        </View>

        <View style={styles.bottom}>
          <Button
            label="get started"
            onPress={() => router.push('/(auth)/sign-up')}
            variant="primary"
          />
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
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
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
})

