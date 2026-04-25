import { useSignUp } from '@clerk/expo'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

export default function SignUpEmailScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({ emailAddress: email })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          <View style={{ flex: 1 }} />

          <View style={styles.content}>
            <Text style={styles.label}>sign up</Text>
            <Text style={styles.headline}>
              {pendingVerification ? 'check your\ninbox.' : 'what\'s your\nemail?'}
            </Text>
            <Text style={styles.body}>
              {pendingVerification
                ? 'we sent a 6-digit code. paste it below.'
                : 'we\'ll send a one-time code. no password needed.'}
            </Text>

            {!pendingVerification ? (
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.ink3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            ) : (
              <TextInput
                style={[styles.input, styles.inputCode]}
                placeholder="123456"
                placeholderTextColor={Colors.ink3}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                value={code}
                onChangeText={setCode}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={pendingVerification ? 'verify' : 'send code'}
              onPress={pendingVerification ? handleVerify : handleSendCode}
              variant="primary"
              disabled={loading || (pendingVerification ? code.length < 6 : !email.includes('@'))}
            />
          </View>

          <View style={{ flex: 1 }} />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const HEADLINE_SIZE = 32

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.s6,
    paddingTop: Spacing.s6,
    paddingBottom: Spacing.s6,
  },
  content: {
    gap: Spacing.s3,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: FontSizes.label * 0.1,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: HEADLINE_SIZE,
    lineHeight: HEADLINE_SIZE * 1.05,
    letterSpacing: -(HEADLINE_SIZE * 0.02),
    color: Colors.ink,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: FontSizes.body * 1.4,
    color: Colors.ink2,
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: Spacing.s4,
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: Colors.ink,
    marginTop: Spacing.s2,
  },
  inputCode: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lead,
    letterSpacing: 4,
    textAlign: 'center',
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.red,
    letterSpacing: -0.2,
  },
})
