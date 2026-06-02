import { useOAuth, useUser } from '@clerk/expo'
import { usePostSignUp } from '@/features/auth/hooks/usePostSignUp'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Svg, { Path } from 'react-native-svg'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'

WebBrowser.maybeCompleteAuthSession()

const ICON = 16

function GoogleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={ICON} height={ICON}>
      <Path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.42-1.13 2.62-2.41 3.43v2.85h3.9c2.28-2.1 3.53-5.19 3.53-8.52z" />
      <Path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.96-2.91l-3.9-2.85c-1.08.72-2.45 1.16-4.06 1.16-3.12 0-5.77-2.11-6.71-4.95H1.26v3.09C3.25 21.3 7.31 24 12 24z" />
      <Path fill="#FBBC05" d="M5.29 14.45A7.19 7.19 0 0 1 4.91 12c0-.85.14-1.68.38-2.45V6.46H1.26C.46 8.14 0 10.02 0 12s.46 3.86 1.26 5.54l4.03-3.09z" />
      <Path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.25 2.7 1.26 6.46l4.03 3.09C6.23 6.88 8.88 4.77 12 4.77z" />
    </Svg>
  )
}

export default function SignUpScreen() {
  const { startOAuthFlow: startGoogle } = useOAuth({ strategy: 'oauth_google' })
  const { user } = useUser()
  const { handlePostSignUp } = usePostSignUp()

  async function handleOAuth(start: ReturnType<typeof useOAuth>['startOAuthFlow']) {
    try {
      // Redirect back to the app root after OAuth. Without this, Clerk defaults
      // to `<scheme>://oauth-native-callback`, which has no route and shows
      // expo-router's "Unmatched Route" page.
      const { createdSessionId, setActive } = await start({ redirectUrl: Linking.createURL('/') })
      if (createdSessionId) {
        await setActive!({ session: createdSessionId })
        const name = user?.fullName ?? user?.firstName ?? 'friend'
        await handlePostSignUp(name)
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }

  const SOCIAL = [
    { label: 'continue with google', Icon: GoogleIcon, ink: true, onPress: () => handleOAuth(startGoogle) },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>

        <View style={{ flex: 1 }} />

        <View style={styles.content}>
          <Text style={styles.label}>welcome</Text>
          <Text style={styles.headline}>{'one tap. no\npassword drama.'}</Text>
          <Text style={styles.body}>new here or coming back — same tap. we just need a name and a face.</Text>

          <View style={styles.socialStack}>
            {SOCIAL.map(({ label, Icon, ink, onPress }) => (
              <Pressable
                key={label}
                style={({ pressed }) => [
                  styles.socialBtn,
                  ink && styles.socialBtnInk,
                  pressed && styles.socialBtnPressed,
                ]}
                onPress={onPress}
              >
                <View style={styles.socialIconWrap}>
                  <Icon />
                </View>
                <Text style={[styles.socialLabel, ink && styles.socialLabelInk]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <Text style={styles.footer}>
          {'by continuing you agree to the terms.\ntogezer pinky-promises no feed, no ads.'}
        </Text>

      </View>
    </SafeAreaView>
  )
}

const HEADLINE_SIZE = 32

const styles = StyleSheet.create({
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
  socialStack: {
    gap: Spacing.s2,
    marginTop: Spacing.s2,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: Spacing.s4,
  },
  socialBtnInk: {
    backgroundColor: Colors.ink,
  },
  socialBtnPressed: {
    opacity: 0.7,
  },
  socialIconWrap: {
    width: ICON,
    alignItems: 'center',
  },
  socialLabel: {
    flex: 1,
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  socialLabelInk: {
    color: Colors.bg,
  },
  footer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: FontSizes.xs * 1.4,
  },
})
