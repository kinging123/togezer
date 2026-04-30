import { useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'

export default function InviteScreen() {
  const { data, isLoading, isError, refetch } = useInviteCode()
  const [copied, setCopied] = useState(false)

  const url = data?.code ? `https://togezer.vercel.app/j/${data.code}` : null
  const displayUrl = data?.code ? `togezer.vercel.app/j/${data.code}` : null

  async function handleCopy() {
    if (!url) return
    await Clipboard.setStringAsync(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!url) return
    await Share.share({ message: url })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.lbl}>step 2 of 2</Text>
        <Text style={styles.headline}>{'bring the\ngang.'}</Text>
        <Text style={styles.sub}>{"you'll see their streaks. they'll see yours."}</Text>

        <View style={styles.card}>
          <View style={styles.cardLblRow}>
            <Text style={styles.lbl}>your invite link</Text>
            {copied && (
              <View style={styles.copiedBadge}>
                <Text style={styles.copiedText}>copied!</Text>
              </View>
            )}
          </View>

          {isLoading && <Text style={styles.urlText}>generating…</Text>}

          {isError && (
            <Pressable onPress={() => refetch()}>
              <Text style={styles.errorText}>failed to load — tap to retry</Text>
            </Pressable>
          )}

          {!isLoading && !isError && displayUrl && (
            <Text style={styles.urlText} numberOfLines={1}>{displayUrl}</Text>
          )}

          <View style={styles.btnRow}>
            <Pressable
              style={[styles.copyBtn, copied && styles.copyBtnCopied, (isLoading || isError) && styles.btnDisabled]}
              onPress={handleCopy}
              disabled={isLoading || isError}
            >
              <Text style={styles.copyBtnLabel}>{copied ? 'copied ✓' : 'copy'}</Text>
            </Pressable>
            <Pressable
              style={[styles.shareBtn, (isLoading || isError) && styles.btnDisabled]}
              onPress={handleShare}
              disabled={isLoading || isError}
            >
              <Text style={styles.shareBtnLabel}>share →</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>{'drop it in whatsapp, imessage,\nwherever your gang lives'}</Text>
        </View>

        <View style={styles.spacer} />

        <Button
          label="continue →"
          onPress={() => router.replace('/(app)')}
          variant="primary"
          disabled={isLoading}
        />
        <Pressable style={styles.skipBtn} onPress={() => router.replace('/(app)')}>
          <Text style={styles.skipText}>skip — go solo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.s6,
    paddingTop: Spacing.s6,
    paddingBottom: Spacing.s6,
  },
  lbl: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: FontSizes.label * 0.1,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 28 * 1.05,
    letterSpacing: -(28 * 0.02),
    color: Colors.ink,
    marginTop: Spacing.s2,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: Colors.ink2,
    lineHeight: FontSizes.body * 1.4,
    letterSpacing: -0.2,
    marginTop: Spacing.s1,
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.md,
    padding: Spacing.s4,
    backgroundColor: Colors.bg,
    gap: Spacing.s2,
    marginTop: Spacing.s4,
  },
  cardLblRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  copiedBadge: {
    backgroundColor: Colors.red,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.s2,
    paddingVertical: 2,
  },
  copiedText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.bg,
  },
  urlText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: Radii.xs,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s2,
    backgroundColor: Colors.bg,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.red,
    letterSpacing: -0.2,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.s2 },
  copyBtn: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.s2,
    alignItems: 'center',
  },
  copyBtnCopied: { backgroundColor: Colors.red },
  copyBtnLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.bg,
  },
  shareBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.s2,
    alignItems: 'center',
  },
  shareBtnLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.ink,
  },
  btnDisabled: { opacity: 0.4 },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.ink3,
    lineHeight: 9 * 1.5,
  },
  spacer: { flex: 1 },
  skipBtn: { alignItems: 'center', marginTop: Spacing.s2 },
  skipText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
  },
})
