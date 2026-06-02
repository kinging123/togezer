import { useState, useRef, useEffect } from 'react'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import { useInviteCode } from '../hooks/useInviteCode'

// Shared invite UI (headline + link card with copy/share). Context-specific
// framing — onboarding step label vs. in-app back/done — lives in the screens
// that render this.
export function InvitePanel() {
  const { data, isLoading, isError, refetch } = useInviteCode()
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
  }, [])

  const url = data?.code ? `https://togezer.vercel.app/j/${data.code}` : null
  const displayUrl = data?.code ? `togezer.vercel.app/j/${data.code}` : null

  async function handleCopy() {
    if (!url) return
    await Clipboard.setStringAsync(url)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopied(true)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!url) return
    await Share.share({ message: url })
  }

  return (
    <>
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
            <Text style={[styles.copyBtnLabel, copied && styles.copyBtnLabelCopied]}>{copied ? 'copied ✓' : 'copy'}</Text>
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
    </>
  )
}

const styles = StyleSheet.create({
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
  lbl: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: FontSizes.label * 0.1,
  },
  copiedBadge: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.s2,
    paddingVertical: 2,
  },
  copiedText: { fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700', color: Colors.ink },
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
  errorText: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.red, letterSpacing: -0.2 },
  btnRow: { flexDirection: 'row', gap: Spacing.s2 },
  copyBtn: { flex: 1, backgroundColor: Colors.ink, borderRadius: Radii.pill, paddingVertical: Spacing.s2, alignItems: 'center' },
  copyBtnCopied: { backgroundColor: Colors.mint },
  copyBtnLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.small, color: Colors.bg },
  copyBtnLabelCopied: { color: Colors.ink },
  shareBtn: { flex: 1, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radii.pill, paddingVertical: Spacing.s2, alignItems: 'center' },
  shareBtnLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.small, color: Colors.ink },
  btnDisabled: { opacity: 0.4 },
  hint: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.ink3, lineHeight: 9 * 1.5 },
})
