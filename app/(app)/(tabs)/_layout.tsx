import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"   options={{ title: 'today' }} />
      <Tabs.Screen name="friends" options={{ title: 'friends' }} />
      <Tabs.Screen name="you"     options={{ title: 'you' }} />
    </Tabs>
  )
}
