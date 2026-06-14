import { Tabs } from 'expo-router'
import { Pressable, View, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { PhosphorIcon, type PhosphorIconName } from '@/components/PhosphorIcon'
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme'

const TAB_ICONS: Record<string, PhosphorIconName> = { index: 'house', you: 'user' }

// Active tab: icon wrapped in a red pill. Inactive: plain muted icon.
function TabIcon({ name, focused }: { name: PhosphorIconName; focused: boolean }) {
  const icon = <PhosphorIcon name={name} color={focused ? Colors.ink : Colors.ink3} size={26} />
  return focused ? <View style={styles.pill}>{icon}</View> : icon
}

// Custom bar so we fully control vertical centering — the default bottom-tab layout
// reserves space below the icon (label row / safe-area) that lifts icons off center.
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { marginBottom: insets.bottom + Spacing.s2 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index
        const name = TAB_ICONS[route.name]
        if (!name) return null

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.item}
          >
            <TabIcon name={name} focused={focused} />
          </Pressable>
        )
      })}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'today' }} />
      <Tabs.Screen name="you" options={{ title: 'you' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  // Floating card: rounded, bordered, hard offset shadow, inset from edges.
  bar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.s4,
    height: 64,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bg,
    ...Platform.select({
      web: { boxShadow: `4px 4px 0 0 ${Colors.ink}` } as object,
      default: { ...Shadows.hard, shadowColor: Colors.ink },
    }),
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: {
    backgroundColor: Colors.red,
    borderRadius: Radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
})
