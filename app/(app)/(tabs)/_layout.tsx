import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PhosphorIcon } from '@/components/PhosphorIcon'
import { Colors } from '@/constants/theme'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Icons-only tab bar — the house/person glyphs are self-explanatory.
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.ink3,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopWidth: 2,
          borderTopColor: Colors.ink,
          height: 56 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'today',
          tabBarIcon: ({ color }) => <PhosphorIcon name="house" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'you',
          tabBarIcon: ({ color }) => <PhosphorIcon name="user" color={color} size={28} />,
        }}
      />
    </Tabs>
  )
}
