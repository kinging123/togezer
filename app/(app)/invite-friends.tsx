import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { InvitePanel } from '@/features/friends/components/InvitePanel'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

export default function InviteFriendsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable testID="back" onPress={() => router.back()}>
          <Text style={styles.back}>← back</Text>
        </Pressable>

        <InvitePanel />

        <View style={styles.spacer} />

        <Button label="done" onPress={() => router.back()} variant="primary" />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.s6, paddingTop: Spacing.s4, paddingBottom: Spacing.s6 },
  back: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.small, color: Colors.ink2, marginBottom: Spacing.s2 },
  spacer: { flex: 1 },
})
