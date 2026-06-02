import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { InvitePanel } from '@/features/friends/components/InvitePanel'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

export default function OnboardingInviteScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.lbl}>step 2 of 2</Text>

        <InvitePanel />

        <View style={styles.spacer} />

        <Button label="continue →" onPress={() => router.replace('/(app)')} variant="primary" />
        <Pressable style={styles.skipBtn} onPress={() => router.replace('/(app)')}>
          <Text style={styles.skipText}>skip — go solo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.s6, paddingTop: Spacing.s6, paddingBottom: Spacing.s6 },
  lbl: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: FontSizes.label * 0.1,
  },
  spacer: { flex: 1 },
  skipBtn: { alignItems: 'center', marginTop: Spacing.s2 },
  skipText: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3 },
})
