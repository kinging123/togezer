import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PhosphorIcon } from '@/components/PhosphorIcon'
import { Colors, Fonts } from '@/constants/theme'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.ink3,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopWidth: 2,
          borderTopColor: Colors.ink,
          height: 60 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.mono,
          fontSize: 10,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: 'lowercase',
        },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'today',
          tabBarIcon: ({ color, size }) => <PhosphorIcon name="house" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'you',
          tabBarIcon: ({ color, size }) => <PhosphorIcon name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
