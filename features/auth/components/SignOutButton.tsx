import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useAuth } from '@clerk/expo'
import { Button } from '@/components/Button'
import { Spacing } from '@/constants/theme'

export function SignOutButton() {
  const { signOut } = useAuth()
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return <Button label="sign out" variant="ghost" onPress={() => setArmed(true)} />
  }

  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Button label="cancel" variant="ghost" onPress={() => setArmed(false)} />
      </View>
      <View style={styles.flex}>
        <Button label="yes, sign out" variant="primary" onPress={() => signOut()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.s3 },
  flex: { flex: 1 },
})
