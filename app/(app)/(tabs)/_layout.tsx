import { Tabs } from 'expo-router'
import { PhosphorIcon } from '@/components/PhosphorIcon'
import { Colors, Fonts } from '@/constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.ink3,
        tabBarStyle: { backgroundColor: Colors.bg, borderTopWidth: 2, borderTopColor: Colors.ink },
        tabBarLabelStyle: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'lowercase' },
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
