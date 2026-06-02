import { useSignUp, useSignIn } from '@clerk/expo'
import { usePostSignUp } from '@/features/auth/hooks/usePostSignUp'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

// Dev-only email login. Unified: tries sign-up, and if the email already exists
// falls back to sign-in — so the same address works whether new or returning.
// In a Clerk development instance, test emails like `you+clerk_test@gmail.com`
// skip real delivery and accept the fixed code 424242.
export default function DevEmailScreen() {
  // Cast: this @clerk/expo version's types describe the newer "signals" shape,
  // but the classic create/prepare/attempt + setActive API is what works at runtime.
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp() as any
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn() as any
  const { handlePostSignUp } = usePostSignUp()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'signUp' | 'signIn' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
    if (!signUpLoaded || !signInLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({ emailAddress: email })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setMode('signUp')
    } catch (err: any) {
      const exists = err?.errors?.some((e: any) => e.code === 'form_identifier_exists')
      if (exists) {
        try {
          const si = await signIn.create({ identifier: email })
          const factor = si.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code')
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (factor as any).emailAddressId })
          setMode('signIn')
        } catch (err2: any) {
          setError(err2?.errors?.[0]?.longMessage ?? 'could not start sign-in')
        }
      } else {
        setError(err?.errors?.[0]?.longMessage ?? 'something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'signUp') {
        const res = await signUp.attemptEmailAddressVerification({ code })
        if (res.status === 'complete') {
          await setActiveSignUp({ session: res.createdSessionId })
          await handlePostSignUp(email.split('@')[0])
        }
      } else {
        const res = await signIn.attemptFirstFactor({ strategy: 'email_code', code })
        if (res.status === 'complete') {
          await setActiveSignIn({ session: res.createdSessionId })
          await handlePostSignUp(email.split('@')[0])
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? 'invalid code')
    } finally {
      setLoading(false)
    }
  }

  const pending = mode !== null

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <View style={styles.flex} />
          <View style={styles.content}>
            <Text style={styles.label}>dev login</Text>
            <Text style={styles.headline}>{pending ? 'enter the\ncode.' : "what's your\ntest email?"}</Text>
            <Text style={styles.body}>
              {pending
                ? 'check your inbox — or use 424242 for a +clerk_test address.'
                : 'tip: use you+clerk_test@gmail.com to mint test users (code 424242).'}
            </Text>

            {!pending ? (
              <TextInput
                style={styles.input}
                placeholder="you+clerk_test@gmail.com"
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
                placeholder="424242"
                placeholderTextColor={Colors.ink3}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                value={code}
                onChangeText={setCode}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={loading ? '…' : pending ? 'verify' : 'send code'}
              onPress={pending ? handleVerify : handleSendCode}
              variant="primary"
              disabled={loading || (pending ? code.length < 6 : !email.includes('@'))}
            />
          </View>
          <View style={styles.flex} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const HEADLINE_SIZE = 32

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.s6, paddingTop: Spacing.s6, paddingBottom: Spacing.s6 },
  content: { gap: Spacing.s3 },
  label: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: FontSizes.label * 0.1 },
  headline: { fontFamily: Fonts.display, fontSize: HEADLINE_SIZE, lineHeight: HEADLINE_SIZE * 1.05, letterSpacing: -(HEADLINE_SIZE * 0.02), color: Colors.ink },
  body: { fontFamily: Fonts.body, fontSize: FontSizes.body, lineHeight: FontSizes.body * 1.4, color: Colors.ink2, letterSpacing: -0.2 },
  input: {
    borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 999,
    paddingVertical: 13, paddingHorizontal: Spacing.s4,
    fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.ink, marginTop: Spacing.s2,
  },
  inputCode: { fontFamily: Fonts.mono, fontSize: FontSizes.lead, letterSpacing: 4, textAlign: 'center' },
  error: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.red, letterSpacing: -0.2 },
})
